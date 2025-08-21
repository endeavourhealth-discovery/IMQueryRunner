docker pull casbin/casdoor
docker run --name mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=casdoor \
  -d mysql:8
docker run --name casdoor -p 8000:8000 -v ${PWD}/conf/app.conf:/conf/app.conf casbin/casdoor:latest
