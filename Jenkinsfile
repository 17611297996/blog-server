pipeline {
    agent any
    tools { nodejs 'NodeJS_22.2' }

    environment {
        // 直接复用前端的 SSH 配置（同一台服务器）
        SSH_SERVER = 'web-server'  
        
        // ⚠️ 后端专用目录，确保和前端目录不同！
        REMOTE_DIR = '/www/wwwroot//www/wwwroot/blog_server'  
        
        PKG_NAME = 'blog_server'
    }

    stages {
        stage('拉取') {
            steps { checkout scm }
        }
        stage('安装依赖') {
            steps {
                sh 'npm install --registry=https://registry.npmmirror.com'
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
                                    // 因为全局 Remote Directory 为空，这里必须写完整绝对路径
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
    post { always { cleanWs() } }
}