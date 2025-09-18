docker pull casbin/casdoor
docker run --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=casdoor -d mysql:8.0
docker run --name casdoor -p 8000:8000 -v ${PWD}/conf/app.conf:/conf/app.conf casbin/casdoor:latest
