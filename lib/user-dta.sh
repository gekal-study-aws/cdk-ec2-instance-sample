#!/bin/bash

yum install httpd -y

systemctl start httpd.service
systemctl enable httpd.service
