pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = "sameersen017/my-app"
        // This line tells Jenkins where to find commands like 'npm'
        PATH = "/opt/homebrew/opt/node@18/bin:/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
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
        
        // This stage now contains the SonarQube analysis and quality gate
        stage('3. SonarQube Analysis & Quality Gate') {
            steps {
                // This 'withSonarQubeEnv' block links the analysis and the quality gate
                withSonarQubeEnv('sonarqube') {
                    sh """
                        sonar-scanner \
                        -Dsonar.projectKey=my-app-devsecops \
                        -Dsonar.sources=. \
                        -Dsonar.exclusions=**/node_modules/**
                    """
                }
                
                // The quality gate check is now a separate step after the analysis
                timeout(time: 1, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        
        stage('4. Docker Build') {
            steps {
                sh """
                    DOCKER_CONFIG=/tmp docker build -t ${DOCKER_IMAGE}:v1.\${BUILD_ID} .
                    DOCKER_CONFIG=/tmp docker tag ${DOCKER_IMAGE}:v1.\${BUILD_ID} ${DOCKER_IMAGE}:latest
                """
            }
        }
        
        stage('5. Trivy Security Scan') {
            steps {
                sh """
                    trivy image --severity HIGH,CRITICAL ${DOCKER_IMAGE}:latest
                    trivy image --format json --output trivy-report.json ${DOCKER_IMAGE}:latest
                    trivy image --severity HIGH,CRITICAL \
                        --format template --template "@/opt/homebrew/share/trivy/templates/html.tpl" \
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
        
        stage('6. Push to Registry') {
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
        
        stage('7. Deploy to Kubernetes') {
            steps {
                sh 'kubectl apply -f deployment.yaml'
                sh 'kubectl rollout status deployment/my-app'
                sh './collect-metrics.sh || true'
            }
        }
    }
    
    post {
        always {
            echo "Pipeline completed - Build #${BUILD_ID}"
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

