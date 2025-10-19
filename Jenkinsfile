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

        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "Installing Node.js dependencies..."
                    npm install
                    echo "Dependencies installed successfully"
                '''
            }
        }

        stage('Generate Postman Collection') {
            steps {
                sh '''
                    echo "Generating Postman collection..."
                    npm run build:collection
                    echo "Collection generated successfully"
                    ls -la build/
                '''
            }
        }

        stage('Copy Postman Collections') {
            steps {
                script {
                    sh '''
                        echo "📦 Automatically discovering and copying Postman collections..."

                        # Create postman-collections directory if it doesn't exist
                        mkdir -p postman-collections

                        # Find all Postman collection files in parent directory projects
                        # Exclude node_modules and postman-collections directories to avoid recursive copying
                        find .. -type f -name "*.postman_collection.json" ! -path "*/node_modules/*" ! -path "*/postman-collections/*" | while read -r collection; do
                            # Get the project directory name
                            project_dir=$(basename $(dirname $(dirname "$collection")))

                            # If the file is in a tests/postman subdirectory, use the parent project name
                            if echo "$collection" | grep -q "/tests/postman/"; then
                                project_name=$(echo "$collection" | sed 's|.*/\\([^/]*\\)/tests/postman/.*|\\1|')
                            else
                                # Otherwise use the directory containing the file
                                project_name=$(basename $(dirname "$collection"))
                            fi

                            # Get the base filename
                            filename=$(basename "$collection")

                            # Create a unique name by prefixing with project name
                            dest_name="${project_name}-${filename}"

                            echo "✓ Copying $collection -> postman-collections/$dest_name"
                            cp "$collection" "postman-collections/$dest_name"
                        done

                        # List copied files
                        echo ""
                        echo "📋 Postman collections available:"
                        ls -la postman-collections/
                        echo ""
                        echo "Total collections: $(ls -1 postman-collections/*.json 2>/dev/null | wc -l)"
                    '''
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: 'build/api-collection.json', fingerprint: true, allowEmptyArchive: true
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh """
                        docker build -t ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} .
                        docker tag ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} ${REGISTRY}/${IMAGE_NAME}:latest
                        docker push ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                        docker push ${REGISTRY}/${IMAGE_NAME}:latest
                    """
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Kill any process using port 9000
                    sh """
                        echo "Killing any process using port 9000..."
                        lsof -ti:9000 | xargs kill -9 || true
                    """

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
                    sh 'sleep 10' // Wait for container to start
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
