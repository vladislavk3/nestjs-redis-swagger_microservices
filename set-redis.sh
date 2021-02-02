echo "Remove redis container"
# Remove all images running 
docker container rm -f $(docker ps -aq)
# Run the redis
echo "Starting redis container"
docker run --name quiz-redis-dev -p 6379:6379 -d redis
