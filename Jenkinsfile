pipeline {
    agent any
    tools { nodejs 'NodeJS_22.2' }

    environment {
        SSH_SERVER = 'web-server'            // 复用前端的配置
        REMOTE_DIR = '/www/wwwroot/egg-backend'
        PKG_NAME = 'egg-backend'
    }

    stages {
        stage('拉取') {
            steps { checkout scm }
        }
        stage('安装依赖') {
            steps {
                sh 'npm install --registry=https://registry.npmmirror.com --fetch-retries=5'
            }
        }
        stage('打包传输') {
            steps {
                sh "tar -czf ${PKG_NAME}.tar.gz --exclude=node_modules --exclude=.git ."
                sshPublisher(
                    publishers: [
                        sshPublisherDesc(
                            configName: "${SSH_SERVER}",
                            transfers: [
                                sshTransfer(
                                    sourceFiles: "${PKG_NAME}.tar.gz",
                                    remoteDirectory: "${REMOTE_DIR}",
                                    execCommand: """
                                        cd ${REMOTE_DIR}
                                        tar -xzf ${PKG_NAME}.tar.gz
                                        rm -f ${PKG_NAME}.tar.gz
                                        npm install --production --registry=https://registry.npmmirror.com
                                        mkdir -p logs run
                                        npm run stop || true
                                        npm start
                                    """
                                )
                            ]
                        )
                    ]
                )
            }
        }
    }
    post {
        always {
            deleteDir()   // 代替 cleanWs()
        }
    }
}