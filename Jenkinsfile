pipeline {
    agent any

    environment {
        DEPLOY_DIR = 'C:\\apps\\food-ordering\\food-ordering-service'
        PM2_HOME   = 'C:\\ProgramData\\pm2'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                dir('food-ordering-service') {
                    bat 'npm ci'
                    bat 'npm run build'
                }
            }
        }

        stage('Stop PM2') {
            steps {
                bat 'pm2 stop food-ordering-service 2>nul & exit 0'
                bat 'pm2 delete food-ordering-service 2>nul & exit 0'
            }
        }

        stage('Deploy') {
            steps {
                bat "if not exist %DEPLOY_DIR%\\uploads mkdir %DEPLOY_DIR%\\uploads"

                bat "robocopy food-ordering-service\\dist %DEPLOY_DIR%\\dist /E /PURGE & if %ERRORLEVEL% LEQ 7 exit 0"
                bat "copy /Y food-ordering-service\\package.json %DEPLOY_DIR%\\package.json"
                bat "copy /Y food-ordering-service\\package-lock.json %DEPLOY_DIR%\\package-lock.json"

                bat "cd %DEPLOY_DIR% && npm ci --omit=dev"
            }
        }

        stage('Deploy Config') {
            steps {
                bat "copy /Y food-ordering-service\\ecosystem.config.js %DEPLOY_DIR%\\ecosystem.config.js"
            }
        }

        stage('Start PM2') {
            steps {
                bat "cd %DEPLOY_DIR% && pm2 start ecosystem.config.js --env production"
                bat 'pm2 save'
            }
        }
    }

    post {
        success {
            bat 'pm2 list'
            echo 'Deployment food-ordering-service successful!'
        }
        failure {
            echo 'Deployment food-ordering-service failed — check the logs above.'
        }
    }
}
