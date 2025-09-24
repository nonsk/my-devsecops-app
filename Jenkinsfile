pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh '''
                export DOCKER_CONFIG=/tmp/docker-config-$$
                mkdir -p $DOCKER_CONFIG
                echo '{}' > $DOCKER_CONFIG/config.json
                /usr/local/bin/docker build -t sameer017/my-app:latest .
                '''
            }
        }
        stage('Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-cred', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh '''
                    export DOCKER_CONFIG=/tmp/docker-config-$$
                    mkdir -p $DOCKER_CONFIG  
                    echo '{}' > $DOCKER_CONFIG/config.json
                    echo $DOCKER_PASSWORD | /usr/local/bin/docker login -u $DOCKER_USERNAME --password-stdin
                    /usr/local/bin/docker push sameer017/my-app:latest
                    '''
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
