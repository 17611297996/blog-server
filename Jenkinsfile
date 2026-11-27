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
                // 代码目录与仓库保持一致；/mock/（文章、分类数据）和 /content/（.md 文件、上传的图片）由线上后台写入，
                // 被排除后 --delete 不会删除或覆盖它们

                sh """
                    rsync -avz --delete \
                        --exclude='node_modules' \
                        --exclude='.git' \
                        --exclude='logs' \
                        --exclude='run' \
                        --exclude='.env' \
                        --exclude='.DS_Store' \
                        --exclude='/mock/' \
                        --exclude='/content/' \
                        ./ ${TARGET_USER}@${TARGET_HOST}:${REMOTE_DIR}/
                """
                // 数据目录只补齐服务器上没有的文件（首次部署、或仓库里新增的文件），已存在的一律不覆盖，也不删除
                sh """
                    rsync -avz --ignore-existing \
                        --exclude='.DS_Store' \
                        --exclude='/content/assets/tmp/' \
                        ./mock ./content ${TARGET_USER}@${TARGET_HOST}:${REMOTE_DIR}/
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