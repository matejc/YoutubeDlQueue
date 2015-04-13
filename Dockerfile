FROM centos:6
MAINTAINER Matej Cotman <cotman.matej@gmail.com>

ENV container docker
ENV USER root

RUN curl -sL https://rpm.nodesource.com/setup | bash -
RUN yum install -y nodejs gcc-c++ wget
RUN npm install --unsafe-perm -g strongloop

RUN rpm --import http://apt.sw.be/RPM-GPG-KEY.dag.txt
RUN wget http://pkgs.repoforge.org/rpmforge-release/rpmforge-release-0.5.3-1.el6.rf.x86_64.rpm && rpm -ivh rpmforge-release-0.5.3-1.el6.rf.x86_64.rpm
RUN yum install -y youtube-dl mplayer

# Get sources
COPY . /youtubedlqueue/
WORKDIR /youtubedlqueue
RUN rm -rf /youtubedlqueue/node_packages

RUN openssl req -new -x509 -nodes -keyout server/private/privatekey.pem -out server/private/certificate.pem -subj "/C=GB/ST=London/L=London/O=Global Security/OU=IT Department/CN=example.xyz"
RUN slc build --install

# Start everything
VOLUME /youtubedlqueue/storage
EXPOSE 4000
ENTRYPOINT slc run --cluster=1
