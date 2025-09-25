pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = "sameersen017/my-app"
        SONAR_PROJECT_KEY = "my-app-devsecops"
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
                    echo "Tests completed"
                '''
            }
        }
        
        stage('3. SonarQube Code Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarQube-scanner'
                    withSonarQubeEnv('SonarQube-server') {
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=http://localhost:9000/sonar \
                            -Dsonar.login=${SONAR_AUTH_TOKEN}
                        """
                    }
                }
            }
        }
        
        stage('4. Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        
        stage('5. Docker Build') {
            steps {
                sh """
                    DOCKER_CONFIG=/tmp /usr/local/bin/docker build -t ${DOCKER_IMAGE}:v1.\${BUILD_ID} .
                    DOCKER_CONFIG=/tmp /usr/local/bin/docker tag ${DOCKER_IMAGE}:v1.\${BUILD_ID} ${DOCKER_IMAGE}:latest
                """
            }
        }
        
        stage('6. Trivy Security Scan') {
            steps {
                sh """
                    trivy image --format json --output trivy-report.json ${DOCKER_IMAGE}:latest
                    trivy image --format template --template "@/opt/homebrew/share/trivy/templates/html.tpl" \
                        --output trivy-report.html ${DOCKER_IMAGE}:latest
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
                withCredentials([usernamePassword(credentialsId: 'docker-cred', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh """
                        DOCKER_CONFIG=/tmp /usr/local/bin/docker login -u \$DOCKER_USERNAME -p \$DOCKER_PASSWORD
                        DOCKER_CONFIG=/tmp /usr/local/bin/docker push ${DOCKER_IMAGE}:v1.\${BUILD_ID}
                        DOCKER_CONFIG=/tmp /usr/local/bin/docker push ${DOCKER_IMAGE}:latest
                    """
                }
            }
        }
        
        stage('8. Deploy to Kubernetes') {
            steps {
                sh '/opt/homebrew/bin/kubectl apply -f deployment.yaml'
                sh '/opt/homebrew/bin/kubectl rollout status deployment/my-app'
            }
        }
    }
    
    post {
        always {
            sh 'echo "Pipeline completed"'
        }
        success {
            sh 'echo "Build #${BUILD_ID} succeeded"'
        }
        failure {
            sh 'echo "Build #${BUILD_ID} failed"'
        }
    }
}
