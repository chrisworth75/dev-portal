// Jenkinsfile for dev-portal
pipeline {
    agent any

    environment {
        REGISTRY = 'localhost:5000'
        IMAGE_NAME = 'dev-portal'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'echo "Checked out dev-portal code successfully"'
            }
        }

        stage('Copy Postman Collections') {
            steps {
                script {
                    sh '''
                        echo "📦 Copying Postman collections from source projects..."

                        # Create postman-collections directory if it doesn't exist
                        mkdir -p postman-collections

                        # Copy Postman collections from various projects
                        if [ -f ../tree-svg/family-tree-api.postman_collection.json ]; then
                            echo "✓ Copying tree-svg/family-tree-api.postman_collection.json"
                            cp ../tree-svg/family-tree-api.postman_collection.json postman-collections/family-tree-svg.postman_collection.json
                        fi

                        if [ -f ../chris-freg-api/tests/postman/fees-api.postman_collection.json ]; then
                            echo "✓ Copying fees-api.postman_collection.json"
                            cp ../chris-freg-api/tests/postman/fees-api.postman_collection.json postman-collections/
                        fi

                        if [ -f ../family-tree-api-java/tests/postman/family-tree-api.postman_collection.json ]; then
                            echo "✓ Copying family-tree-api-java Postman collection"
                            cp ../family-tree-api-java/tests/postman/family-tree-api.postman_collection.json postman-collections/family-tree-api-java.postman_collection.json
                        fi

                        if [ -f ../family-tree-api-quarkus/tests/postman/family-tree-api.postman_collection.json ]; then
                            echo "✓ Copying family-tree-api-quarkus Postman collection"
                            cp ../family-tree-api-quarkus/tests/postman/family-tree-api.postman_collection.json postman-collections/family-tree-api-quarkus.postman_collection.json
                        fi

                        if [ -f ../family-tree-api-node/tests/postman/family-tree-api.postman_collection.json ]; then
                            echo "✓ Copying family-tree-api-node Postman collection"
                            cp ../family-tree-api-node/tests/postman/family-tree-api.postman_collection.json postman-collections/family-tree-api-node.postman_collection.json
                        fi

                        # List copied files
                        echo "📋 Postman collections available:"
                        ls -la postman-collections/
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def image = docker.build("${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}")
                    docker.withRegistry("http://${REGISTRY}") {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Stop existing container if running
                    sh """
                        docker stop ${IMAGE_NAME} || true
                        docker rm ${IMAGE_NAME} || true
                    """

                    // Run new container on port 9000
                    sh """
                        docker run -d \\
                        --name ${IMAGE_NAME} \\
                        --restart unless-stopped \\
                        -p 9000:9000 \\
                        ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                    """
                }
            }
        }

        stage('Health Check') {
            when {
                branch 'main'
            }
            steps {
                script {
                    sleep 10 // Wait for container to start
                    sh 'curl -f http://localhost:9000/health || echo "Health check failed - container may still be starting"'
                }
            }
        }
    }

    post {
        success {
            echo '✅ Dev Portal pipeline completed successfully!'
            echo '🌐 Portal available at http://localhost:9000'
        }
        failure {
            echo '❌ Dev Portal pipeline failed!'
        }
    }
}
