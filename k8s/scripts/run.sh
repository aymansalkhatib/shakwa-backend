#!/bin/bash
#
# Start minikube tunnel to expose LoadBalancer services
echo "Starting minikube tunnel..."
minikube service shakwa-backend-service -n shakwa --url
