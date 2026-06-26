pipeline {
    agent any

    // 不再需要 tools 指定 Node.js，因为所有构建都在目标服务器上执行
    // tools { nodejs 'NodeJS_22.2' }

    environment {
        // 目标服务器信息（请根据实际情况修改）
        TARGET_HOST = '39.105.99.177'          // 服务器 IP
        TARGET_USER = 'root'                  // SSH 用户名
        REMOTE_DIR = '/www/wwwroot/blog_server' // 部署目录（必须已存在）
        // 如果 Jenkins 容器内 SSH 密钥不在默认位置，可指定路径，例如：
        // SSH_KEY_PATH = '/var/jenkins_home/.ssh/id_rsa'
    }

    stages {
        stage('拉取代码') {
            steps {
                checkout scm
                // 可选：打印当前分支和最新 commit
                sh 'git log -1 --pretty=format:"%h - %s"'
            }
        }

        stage('同步代码到服务器') {
            steps {
                sh """
                    # 使用 rsync 增量同步，排除不需要的目录
                    # -avz 归档模式 + 压缩传输（节省带宽）
                    # --delete 删除远程多余文件（保持完全一致）
                    # 如果 SSH 密钥不在默认位置，添加 -e "ssh -i ${SSH_KEY_PATH}"
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
                        set -e  # 任何命令失败则终止脚本
                        
                        cd ${REMOTE_DIR}
                        
                        echo "========================================"
                        echo "📍 当前目录: $(pwd)"
                        echo "📦 Node 版本: $(node -v)"
                        echo "📦 npm 版本: $(npm -v)"
                        echo "========================================"
                        
                        # 1. 停止旧进程（确保端口释放）
                        echo "🛑 正在停止旧服务..."
                        if grep -q '"stop"' package.json 2>/dev/null; then
                            npm run stop || true
                        fi
                        # 强力清理（以防 egg-scripts 未正常退出）
                        pkill -f "egg-server" || true
                        pkill -f "node.*${REMOTE_DIR}" || true
                        sleep 2
                        
                        # 2. 安装生产依赖（只安装运行时需要的包）
                        echo "📥 安装生产依赖..."
                        npm install --production --registry=https://registry.npmmirror.com --fetch-retries=5
                        
                        # 3. 创建运行时目录（日志、pid 等）
                        mkdir -p logs run
                        
                        # 4. 启动 Egg 应用
                        echo "🚀 启动服务..."
                        npm start
                        
                        # 5. 等待几秒检查进程是否存在
                        sleep 3
                        if pgrep -f "egg-server" > /dev/null; then
                            echo "✅ 部署成功！服务已启动。"
                        else
                            echo "⚠️ 启动后未检测到进程，请检查日志。"
                            # 可选：打印启动日志最后几行
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
            // 清理 Jenkins 工作空间，释放磁盘
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