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


Browser: https://localhost:4000/index.html


## Docker

    docker build -t matejc/youtubedlqueue .

    mkdir -p /home/"$USER"/.ytdlq/audio

    docker run --rm -p 4000:4000 -v /home/"$USER"/.ytdlq:/youtubedlqueue/storage -v /dev/snd:/dev/snd --lxc-conf='lxc.cgroup.devices.allow = c 116:* rwm' --device=/dev/dsp:/dev/dsp -it matejc/youtubedlqueue:latest


Browser: https://localhost:4000/index.html
