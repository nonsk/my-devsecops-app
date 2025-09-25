pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = "sameersen017/my-app"
        SONAR_PROJECT_KEY = "my-app-devsecops"
        PATH = "/opt/homebrew/opt/node@18/bin:/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
        SONAR_TOKEN = credentials('sonar-token')
    }
    
    stages {
        stage('1. Checkout') {
            steps {
                checkout scm
                sh 'echo "Source code checked out successfully"'
            }
        }
        
        stage('2. Install Dependencies & Test') {
            steps {
                sh '''
                    npm install
                    npm test
                '''
            }
        }
        
        stage('3. SonarQube Code Analysis') {
            steps {
                sh """
                    sonar-scanner \
                    -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                    -Dsonar.sources=. \
                    -Dsonar.exclusions=**/node_modules/**,**/services/** \
                    -Dsonar.host.url=http://localhost:9000/sonar \
                    -Dsonar.token=$SONAR_TOKEN
                """
            }
        }
        
        stage('4. Quality Gate') {
            steps {
                timeout(time: 1, unit: 'minute') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        
        stage('5. Docker Build') {
            steps {
                sh """
                    DOCKER_CONFIG=/tmp docker build -t ${DOCKER_IMAGE}:v1.\${BUILD_ID} .
                    DOCKER_CONFIG=/tmp docker tag ${DOCKER_IMAGE}:v1.\${BUILD_ID} ${DOCKER_IMAGE}:latest
                """
            }
        }
        
        stage('6. Trivy Security Scan') {
            steps {
                sh """
                    trivy image --format json --output trivy-report.json ${DOCKER_IMAGE}:latest || true
                    trivy image --severity HIGH,CRITICAL \
                        --format template --template "@/opt/homebrew/share/trivy/templates/html.tpl" \
                        --output trivy-report.html ${DOCKER_IMAGE}:latest || true
                """
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: '.',
                    reportFiles: 'trivy-report.html',
                    reportName: 'Trivy Security Report'
                ])
            }
        }
        
        stage('7. Push to Registry') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-cred', 
                                                  passwordVariable: 'DOCKER_PASSWORD', 
                                                  usernameVariable: 'DOCKER_USERNAME')]) {
                    sh """
                        DOCKER_CONFIG=/tmp docker login -u \$DOCKER_USERNAME -p \$DOCKER_PASSWORD
                        DOCKER_CONFIG=/tmp docker push ${DOCKER_IMAGE}:v1.\${BUILD_ID}
                        DOCKER_CONFIG=/tmp docker push ${DOCKER_IMAGE}:latest
                    """
                }
            }
        }
        
        stage('8. Deploy to Kubernetes') {
            steps {
                sh 'kubectl apply -f deployment.yaml'
                sh 'kubectl rollout status deployment/my-app'
                sh './collect-metrics.sh || true'
            }
        }
    }
    
    post {
        always {
            echo "8-stage pipeline completed - Build #${BUILD_ID}"
            cleanWs()
        }
        success {
            echo "All stages passed successfully"
        }
        failure {
            echo "Pipeline failed"
        }
    }
}
