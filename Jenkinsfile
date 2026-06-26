pipeline {
    agent any

    // 不再需要 tools，因为依赖安装和运行都在目标服务器上
    // tools { nodejs 'NodeJS_22.2' }

    environment {
        TARGET_HOST = '39.105.99.177'
        TARGET_USER = 'root'
        REMOTE_DIR = '/www/wwwroot/egg-backend'
    }

    stages {
        stage('拉取代码') {
            steps {
                checkout scm
                sh 'git log -1 --pretty=format:"%h - %s"'
            }
        }

        stage('同步代码到服务器') {
            steps {
                sh """
                    rsync -avz --delete \
                        --exclude='node_modules' \
                        --exclude='.git' \
                        --exclude='logs' \
                        --exclude='run' \
                        --exclude='.env' \
                        --exclude='.DS_Store' \
                        ./ ${TARGET_USER}@${TARGET_HOST}:${REMOTE_DIR}/
                """
            }
        }

        stage('远程安装并启动') {
            steps {
                sh """
                    ssh ${TARGET_USER}@${TARGET_HOST} << 'EOF'
                        set -e
                        cd ${REMOTE_DIR}

                        echo "========================================"
                        echo "📍 当前目录: \$(pwd)"
                        echo "📦 Node 版本: \$(node -v)"
                        echo "📦 npm 版本: \$(npm -v)"
                        echo "========================================"

                        # 停止旧进程
                        echo "🛑 正在停止旧服务..."
                        if grep -q '"stop"' package.json 2>/dev/null; then
                            npm run stop || true
                        fi
                        pkill -f "egg-server" || true
                        pkill -f "node.*${REMOTE_DIR}" || true
                        sleep 2

                        # 安装生产依赖
                        echo "📥 安装生产依赖..."
                        npm install --production --registry=https://registry.npmmirror.com --fetch-retries=5

                        # 创建运行时目录
                        mkdir -p logs run

                        # 启动服务
                        echo "🚀 启动服务..."
                        npm start

                        # 检查进程
                        sleep 3
                        if pgrep -f "egg-server" > /dev/null; then
                            echo "✅ 部署成功！服务已启动。"
                        else
                            echo "⚠️ 启动后未检测到进程，请检查日志。"
                            tail -20 logs/egg-server.log 2>/dev/null || echo "暂无日志"
                            exit 1
                        fi
                        echo "========================================"
EOF
                """
            }
        }
    }

    post {
        always {
            deleteDir()
        }
        success {
            echo '🎉 部署成功！'
        }
        failure {
            echo '❌ 部署失败，请检查日志。'
        }
    }
}