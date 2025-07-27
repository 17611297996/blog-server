# React Hooks 完全指南

> 发布时间：2024-01-20  
> 分类：前端开发 > React  
> CICD, 服务器, 部署

## 前言

每次部署项目时，手动将文件拷贝到服务器不仅繁琐，还容易出错。因此，我决定学习如何进行前端全自动部署。我的目标是让部署过程更加便捷高效，只需提交代码，服务器就能自动更新，这样可以大大节省时间，提高工作效率。

在开始学习前端自动部署之前，建议你提前了解一些基础的服务器知识。虽然不需要深入掌握所有命令(命令可以百度或者问 AI)，但熟悉常见的服务器操作和部署流程会让你在遇到问题时更加从容。可以在遇到具体问题时通过百度等 AI 工具查找相关命令和解决方案。这样，在实现自动部署的过程中，你不仅能更高效地完成部署工作，还能逐步积累服务器管理的经验，为后续的自动化部署打下坚实的基础

```plain
将网站一键部署到服务器的方案很多，比如纯Shell脚本结合SSH、Jenkins等工具。本文将介绍如何利用GitHub Actions这一免费且轻量的CI/CD工具，实现代码推送后自动部署到云服务器
```

## 准备工作

-   需要有自己的服务器，我的是阿里云的服务器

-   创建一个代码存储库(我的是 github)

-   项目类型：静态网站、及 node 服务

## ssh 密钥配置

#### 服务器端配置

在服务器实例连接后操作

-   **生成 SSH 密钥对**（如果已有可跳过）：

```bash
# 生成密钥对（默认保存到 ~/.ssh/）
ssh-keygen -t ed25519 -C "github-actions"
```

-   **将公钥添加到服务器的**`authorized_keys`

```bash
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys //设置权限
```

-   **确保服务器 SSH 配置允许密钥登录**（检查  `/etc/ssh/sshd_config`）:

```plain
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
```

登录服务器，打开 SSH 配置文件（通常为  `/etc/ssh/sshd_config`）：

```bash
sudo vim /etc/ssh/sshd_config  # 或使用 nano
```

确保以下参数已正确设置：

```bash
# 启用密钥认证
PubkeyAuthentication yes


# 公钥文件路径（默认值一般无需修改）
AuthorizedKeysFile .ssh/authorized_keys


# 可选：禁用密码登录（提高安全性）
PasswordAuthentication no
```

如果没有，自行设置一下 按 i 编辑，编辑完按下 esc 然后:wq 回车保存

## ssh-配置验证

SSH 对文件权限非常敏感，需确保以下权限正确：

1. **验证文件权限**

#### `.ssh`**目录权限**

```bash
# 用户目录下的 .ssh 文件夹权限
chmod 700 ~/.ssh
```

#### `authorized_keys`**文件权限**

```bash
chmod 600 ~/.ssh/authorized_keys
```

1. **重启 SSH 服务**

修改配置后，重启 SSH 服务使配置生效：

```plain
# Ubuntu/Debian
sudo systemctl restart ssh


# CentOS/RHEL
sudo systemctl restart sshd
```

1. **测试密钥登录**

从你的本地机器(服务器面板)测试是否能通过密钥登录服务器：

```plain
ssh -i ~/.ssh/你的私钥文件 username@服务器IP -p 端口
```

你的私钥文件：就是你创建密钥的文件名称
username@服务器 ip：服务器用户名+ip 中间@隔开

端口：默认的 ssh 端口为 22

如果失败，可添加  `-v`  参数查看详细日志

成功了会提示

```bash
Welcome to Alibaba Cloud Elastic Compute Service !
```

#### GitHub 仓库配置

-   进入仓库的  **Settings > Secrets and variables > Actions**，添加以下 Secrets：

    -   `SERVER_IP`: 服务器 IP 地址（如  `123.123.123.123`） //就是你服务器的公网 ip

    -   `SSH_PORT`: SSH 端口（默认  `22`）

    -   `SSH_USERNAME`: SSH 登录用户名（如  `root`）

    -   `SSH_PRIVATE_KEY`: 服务器的私钥内容（`id_ed25519`  文件内容）

| 命令              | 解释                                         |
| :---------------- | :------------------------------------------- |
| cat ~/.ssh/id_rsa | 查看私钥命令 id_rsa 替换为你生成的密钥文件名 |

## GitHub-actions-工作流配置

### 基本配置

在项目根目录创建  `.github/workflows/deploy.yml`  文件，或者点击仓库上方的 action ，随便点击一个模版创建一个也行，然后创建一下 deploy.yml 文件

这是我的 yml 文件，可以进行参考，这是我前端 vue 项目的，当然你也可以让 AI 帮你写一份都是可以的，不过这里面坑挺多，我身为前端懂得也不多，只能慢慢摸索

这里有一些文档[https://docs.github.com/zh/actions/sharing-automations/creating-actions/metadata-syntax-for-github-actions](https://docs.github.com/zh/actions/sharing-automations/creating-actions/metadata-syntax-for-github-actions)

```yaml
name: 部署到服务器


on:
    push:
        branches: ['main']


jobs:
    deploy:
        runs-on: ubuntu-latest


        steps:
            - name: 检出代码
              uses: actions/checkout@v4


            - name: 调试-列出仓库文件
              run: ls -la $GITHUB_WORKSPACE


            - name: 配置SSH环境
              run: |
                  mkdir -p ~/.ssh
                  chmod 700 ~/.ssh
                  echo "${{ secrets.SSH_PRIVATE_KEY }}" | tr -d '\r' > ~/.ssh/github_actions_key
                  chmod 600 ~/.ssh/github_actions_key
                  ssh-keyscan -p ${{ secrets.SSH_PORT }} ${{ secrets.SERVER_IP }} >> ~/.ssh/known_hosts


            - name: 安装Rsync工具
              run: sudo apt-get update && sudo apt-get install -y rsync


            - name: 构建项目（适配pnpm/npm）
              working-directory: vue-blog-project
              run: |
                  npm install -g pnpm
                  pnpm install
                  rm -rf node_modules/.vite
                  pnpm run build


            - name: 调试-显示构建产物
              run: ls -la vue-blog-project/dist


            - name: 设置服务器同步参数
              run: |
                  mkdir -p ~/.ssh
                  chmod 700 ~/.ssh
                  echo "${{ secrets.SSH_PRIVATE_KEY }}" | tr -d '\r' > ~/.ssh/github_actions_key
                  chmod 600 ~/.ssh/github_actions_key
                  ssh-keyscan -p ${{ secrets.SSH_PORT }} ${{ secrets.SERVER_IP }} >> ~/.ssh/known_hosts


            - name: 同步构建文件到服务器
              run: |
                  rsync -avz --progress --delete \
                    --exclude='node_modules' \
                    --exclude='.git' \
                    --exclude='.DS_Store' \
                    -e "ssh -i ~/.ssh/github_actions_key -o StrictHostKeyChecking=no -p ${{ secrets.SSH_PORT }}" \
                    ./vue-blog-project/dist/ \
                    ${{ secrets.SSH_USERNAME }}@${{ secrets.SERVER_IP }}:/www/wwwroot/default/
```

配置完这个文件之后，就可以进行提交代码，然后点击 action 进行测试啦，会看到执行到哪一个步骤了

我这个采用的是，通过 rsync 来进行同步到服务器静态文件，install 下载完包之后，然后进行构建，构建完成之后会把 dist 文件同步发到我相应的服务器网站上，网站是对应文件夹的(操作过服务器的知道)

### 不是静态文件的情况下

有一些项目不是这种静态文件的，可能是服务端、就比如 node.js 、我这个是 egg

是需要使用 pm2 进行监管的。那么就需要改一下 yml 文件了

```yaml
name: 部署到服务器


on:
    push:
        branches: ['main']


jobs:
    deploy:
        runs-on: ubuntu-latest


        steps:
            - name: 检出仓库代码
              uses: actions/checkout@v4


            - name: 设置SSH环境
              run: |
                  mkdir -p ~/.ssh
                  chmod 700 ~/.ssh
                  echo "${{ secrets.SSH_PRIVATE_KEY }}" | tr -d '\r' > ~/.ssh/github_actions_key
                  chmod 600 ~/.ssh/github_actions_key
                  ssh-keyscan -p ${{ secrets.SSH_PORT }} ${{ secrets.SERVER_IP }} >> ~/.ssh/known_hosts


            - name: 安装Rsync工具
              run: sudo apt-get update && sudo apt-get install -y rsync


            - name: 同步文件到服务器
              run: |
                  rsync -avz --progress \
                    --exclude='.git' \
                    --exclude='.github/' \
                    --exclude='node_modules/' \
                    --exclude='*.log' \
                    -e "ssh -i ~/.ssh/github_actions_key -o StrictHostKeyChecking=no -p ${{ secrets.SSH_PORT }}" \
                    $GITHUB_WORKSPACE/ \
                    ${{ secrets.SSH_USERNAME }}@${{ secrets.SERVER_IP }}:/www/wwwroot/egg-blog/ \
                    || echo "忽略非关键错误"


            - name: 停止并启动应用服务
              run: |
                  ssh -i ~/.ssh/github_actions_key -p ${{ secrets.SSH_PORT }} ${{ secrets.SSH_USERNAME }}@${{ secrets.SERVER_IP }} <<EOF
                  # 停止服务
                  cd /www/wwwroot/egg-blog && npm stop || echo "停止服务失败，可能服务未运行"


                  # 启动服务
                  cd /www/wwwroot/egg-blog && nohup npm start > /dev/null 2>&1 &
                  EOF


            - name: 调试-列出目标目录文件
              run: |
                  ssh -i ~/.ssh/github_actions_key -p ${{ secrets.SSH_PORT }} ${{ secrets.SSH_USERNAME }}@${{ secrets.SERVER_IP }} \
                    "ls -la /www/wwwroot/egg-blog"
```

加了一些操作，文件同步到服务器之后，先停止当前启动的服务，然后同步过去之后在进行重新启动。

## 常见问题总结

我自己操作的途中遇到了一些问题，也是很苦恼，我也给列出来

1. 权限错误

2. shh 密钥与服务器连接不上（大概率是权限问题导致的，要不然就是密钥错误）

3. yml 文件配置问题

4. SELinux 或防火墙限制

这个就是防火墙及安全组的问题，如果你要用什么端口就需要去防火墙或安全组开放这个端口，要不然不可以使用

### 权限问题

不管是在流水线同步文件的时候 或者是执行直接就报错的时候，出现类似于

Permissions 字眼，那么就是权限问题导致

建议：

仔细检查服务器的文件夹权限，看是否有读写权限，检查清楚操作用户是谁，是 root 还是 admin 等等，设置同步目录的权限

### ssh 密钥与服务器连接不上

这个要检查好你的私钥是否错误，要复制全，包括

-----BEGIN OPENSSH PRIVATE KEY-----

使用你自己的密钥
-----END OPENSSH PRIVATE KEY-----

这种格式

另外还要记得在阿里云实例，安全组开放 22 端口，以及在服务器内部可以通过宝塔进去，然后点击安全，把 22 端口开放

![图片](/content/assets/images/前端也要必备的全自动化部署cicd-1-5ba7e23f.png)

### yml 文件配置问题

这个是需要一定的了解，或者不断的去尝试，寻求 AI 的帮助，慢慢自己去摸索，去探索，后端或者运维对这个可能要熟悉很多，也可以查一下他的文档，

如果流水线 同步文件的时候提示没权限的话，

那么就去登陆服务器进去，设置一下你目录的权限为 755 或者 777，

![图片](/content/assets/images/前端也要必备的全自动化部署cicd-2-40ae0f05.png)
