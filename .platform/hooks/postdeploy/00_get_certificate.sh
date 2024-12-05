#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d theturtleshelterproject.is404.net --nginx --agree-tos --email andrewallred509@gmail.com
