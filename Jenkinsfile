pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'DOCKER_CONFIG=/tmp /usr/local/bin/docker build -t sameer017/my-app:latest .'
            }
        }
        stage('Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-cred', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh 'DOCKER_CONFIG=/tmp /usr/local/bin/docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD'
                    sh 'DOCKER_CONFIG=/tmp /usr/local/bin/docker push sameer017/my-app:latest'
                }
            }
        }
        stage('Deploy') {
            steps {
                sh '/opt/homebrew/bin/kubectl apply -f deployment.yaml'
            }
        }
    }
}
