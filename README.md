# YoutubeDlQueue

REST API for youtube-dl and UI


## Dependencies

mplayer, nodejs, openssl, youtube-dl


## Installation

    npm install strongloop

    npm install --production

    cd ./server/private
    openssl genrsa -out privatekey.pem 1024
    openssl req -new -key privatekey.pem -out certrequest.csr
    openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem
    cd ../..

    # EDIT USERS BEFORE FIRST RUN!!
    nano ./server/users.json

    slc run
