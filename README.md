# cellalife-bot

## 环境安装

1. Linux安装git(mac 默认有，无需安装)

```
apt-get update
apt-get -y install git
```

2. 安装node环境
```
git clone https://github.com/nvm-sh/nvm.git
cd nvm
sh ./install.sh
nvm install v20.11.0
```

## 初始脚本依赖

``` 
git clone https://github.com/SateaLabs/cellalife-bot.git
npm install
```

## 配置钱包

编辑 walletlist.csv文件将钱包地址和对应私钥保存至文件
```
"address","privateKey"
0x0,0x0
```

## 配置配方种子

编辑修改seeds.json文件,将你获取到的配方种子保存在文件中，可以配置多个
```
[
    [[276,1],[164,2],[496,3],[295,4],[195,5],[128,6],[367,7],[408,8]],
    [[276,1],[164,2],[496,3],[295,4],[195,5],[128,6],[367,7],[408,8]]
]
```

## 脚本执行

> 本脚本分为mint ,buyfood, claim三个脚本。每个脚本都是按照配置的钱包和配方种子按顺序执行。 
> 需要注意的是操作脚本之前，需要给钱包放入足够的BNB。
> 本脚本功能比较简单，使用方式不是很灵活，懂一点技术可以改成自己想要的样子。

1. 创建配方生命
```
node mint.js
```
2. 给生命喂食
```
node buyfood.js
```
3. 收取能量
```
node claim.js
```
