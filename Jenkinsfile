pipeline {
    agent any

    environment {
        DEPLOY_ROOT = 'D:\\ICS-Projects\\apps\\food-ordering'
        DEPLOY_DIR  = 'D:\\ICS-Projects\\apps\\food-ordering\\food-ordering-service'
        PM2_HOME    = 'C:\\Users\\Administrator\\.pm2'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Env') {
            steps {
                // The production .env is placed manually on the server and lives at
                // %DEPLOY_DIR%\.env . The pipeline never creates or overwrites it;
                // it only fails early here if it is missing so PM2 does not crash-loop.
                bat '''
                    if not exist "%DEPLOY_DIR%\\.env" (
                        echo ERROR: "%DEPLOY_DIR%\\.env" not found.
                        echo Place the production .env file there manually, then re-run this build.
                        exit /b 1
                    )
                    echo Found "%DEPLOY_DIR%\\.env"
                '''
            }
        }

        stage('Build') {
            steps {
                bat 'npm ci'
                bat 'npm run build'
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

                // robocopy uses exit codes 0-7 for success (>=8 = real failure).
                // Check errorlevel on its own line so it is read AFTER robocopy runs,
                // then normalise to 0 so the bat step is not marked as failed.
                bat """
                    robocopy dist %DEPLOY_DIR%\\dist /E /PURGE
                    if %ERRORLEVEL% GEQ 8 (exit /b 1) else (exit /b 0)
                """
                bat """
                    robocopy prisma %DEPLOY_DIR%\\prisma /E /PURGE
                    if %ERRORLEVEL% GEQ 8 (exit /b 1) else (exit /b 0)
                """
                bat "copy /Y prisma.config.ts %DEPLOY_DIR%\\prisma.config.ts"
                bat "copy /Y package.json %DEPLOY_DIR%\\package.json"
                bat "copy /Y package-lock.json %DEPLOY_DIR%\\package-lock.json"

                bat "cd /d %DEPLOY_DIR% && npm ci --omit=dev"
            }
        }

        stage('Deploy Config') {
            steps {
                bat "copy /Y ecosystem.config.js %DEPLOY_DIR%\\ecosystem.config.js"
            }
        }

        stage('Start PM2') {
            steps {
                bat "if not exist %DEPLOY_DIR%\\logs mkdir %DEPLOY_DIR%\\logs"
                bat "cd /d %DEPLOY_DIR% && pm2 start ecosystem.config.js --only food-ordering-service --env production"
                bat 'pm2 save'
            }
        }

        stage('Register Startup') {
            steps {
                bat 'pm2-startup install 2>nul & exit 0'
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
