# Docker and Kubernetes Deployment Guide

This guide provides comprehensive instructions for deploying the Shakwa NestJS backend using Docker and Kubernetes with nginx ingress, load balancing, and horizontal auto-scaling.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Docker Setup](#docker-setup)
- [Kubernetes Deployment](#kubernetes-deployment)
- [nginx Ingress Controller](#nginx-ingress-controller)
- [Auto-Scaling Configuration](#auto-scaling-configuration)
- [Monitoring and Management](#monitoring-and-management)
- [Troubleshooting](#troubleshooting)
- [Useful Commands](#useful-commands)

---

## Prerequisites

### Required Tools

1. **Docker** (v20.10+)
   - Install from: https://docs.docker.com/get-docker/
   - Verify: `docker --version`

2. **kubectl** (v1.25+)
   - Install from: https://kubernetes.io/docs/tasks/tools/
   - Verify: `kubectl version --client`

3. **Kubernetes Cluster**
   - **Local Development**: [Minikube](https://minikube.sigs.k8s.io/docs/start/) or [Kind](https://kind.sigs.k8s.io/)
   - **Cloud**: Google Kubernetes Engine (GKE), Amazon EKS, or Azure AKS
   - **Managed**: Docker Desktop Kubernetes, Rancher Desktop

4. **Container Registry** (for production)
   - Docker Hub, Google Container Registry (GCR), Amazon ECR, or Azure ACR

### External Services

Ensure the following services are accessible from your cluster:

- PostgreSQL (Supabase)
- Redis (Cloud hosted)
- Firebase Storage
- Resend Email Service

---

## Quick Start

For the impatient, here's the TL;DR:

```bash
# 1. Build Docker image
docker build -t shakwa-backend:latest .

# 2. Test locally with Docker Compose
docker-compose up

# 3. Deploy to Kubernetes (update image registry first!)
kubectl apply -f k8s/

# 4. Check deployment status
kubectl get all -n shakwa

# 5. Get LoadBalancer IP
kubectl get svc -n shakwa shakwa-backend-service
```

---

## Docker Setup

### 1. Build Docker Image

Build the production-optimized Docker image:

```bash
docker build -t shakwa-backend:latest .
```

**Build arguments** (optional):

```bash
docker build \
  --build-arg NODE_VERSION=20 \
  -t shakwa-backend:latest .
```

### 2. Test Locally with Docker

Run a single container for testing:

```bash
docker run -d \
  -p 3000:3000 \
  --env-file env/.env.production \
  --name shakwa-test \
  shakwa-backend:latest
```

Test the application:

```bash
curl http://localhost:3000/api/health
```

Stop and remove:

```bash
docker stop shakwa-test
docker rm shakwa-test
```

### 3. Test with Docker Compose

Use Docker Compose for a more complete local environment:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Push Image to Registry

**For Docker Hub:**

```bash
# Login
docker login

# Tag image
docker tag shakwa-backend:latest your-dockerhub-username/shakwa-backend:latest

# Push
docker push your-dockerhub-username/shakwa-backend:latest
```

**For Google Container Registry (GCR):**

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Tag image
docker tag shakwa-backend:latest gcr.io/your-project-id/shakwa-backend:latest

# Push
docker push gcr.io/your-project-id/shakwa-backend:latest
```

**For Amazon ECR:**

```bash
# Get login token
aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com

# Tag image
docker tag shakwa-backend:latest your-account-id.dkr.ecr.your-region.amazonaws.com/shakwa-backend:latest

# Push
docker push your-account-id.dkr.ecr.your-region.amazonaws.com/shakwa-backend:latest
```

---

## Kubernetes Deployment

### Step 1: Update Configuration

#### Update Image Registry

Edit `k8s/deployment.yaml` and replace the image reference:

```yaml
spec:
  containers:
    - name: shakwa-backend
      image: your-registry/shakwa-backend:latest # ← UPDATE THIS
```

Examples:

- Docker Hub: `your-username/shakwa-backend:latest`
- GCR: `gcr.io/your-project-id/shakwa-backend:latest`
- ECR: `your-account-id.dkr.ecr.region.amazonaws.com/shakwa-backend:latest`

#### Update Secrets

**IMPORTANT**: Before deploying to production, update the secrets in `k8s/secret.yaml`:

```yaml
stringData:
  JWT_ACCESS_SECRET: 'your-secure-32-char-access-secret'
  JWT_REFRESH_SECRET: 'your-secure-32-char-refresh-secret'
  JWT_SECURITY_SECRET: 'your-secure-32-char-security-secret'
  POSTGRES_PASSWORD: 'your-database-password'
  SUPER_ADMIN_PASSWORD: 'your-admin-password'
  RESEND_API_KEY: 'your-resend-api-key'
  REDIS_URL: 'redis://your-redis-connection-string'
  # ... update other secrets as needed
```

#### Update Domain (Optional)

If using a custom domain with Ingress, edit `k8s/ingress.yaml`:

```yaml
spec:
  rules:
    - host: shakwa.yourdomain.com # ← UPDATE THIS
```

### Step 2: Create Kubernetes Resources

Deploy all resources to your cluster:

```bash
# Apply all manifests
kubectl apply -f k8s/

# Or apply individually in order:
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml
```

### Step 3: Verify Deployment

Check that all resources are created:

```bash
# View all resources in the namespace
kubectl get all -n shakwa

# Check pod status
kubectl get pods -n shakwa

# View deployment details
kubectl describe deployment shakwa-backend -n shakwa

# Check service and external IP
kubectl get svc -n shakwa
```

Expected output for pods:

```
NAME                              READY   STATUS    RESTARTS   AGE
shakwa-backend-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
shakwa-backend-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
shakwa-backend-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
```

### Step 4: Access the Application

#### Via LoadBalancer

Get the external IP:

```bash
kubectl get svc shakwa-backend-service -n shakwa
```

Access the application:

```bash
# Get the EXTERNAL-IP and use it
curl http://<EXTERNAL-IP>/api/health
```

**Note**: On Minikube, use `minikube service shakwa-backend-service -n shakwa` to access.

#### Via Port Forward (Development)

For local development without LoadBalancer:

```bash
kubectl port-forward -n shakwa svc/shakwa-backend-service 3000:80
```

Then access at: http://localhost:3000

---

## nginx Ingress Controller

The nginx Ingress Controller provides advanced routing, SSL termination, and load balancing.

### Installation

#### For Minikube

```bash
minikube addons enable ingress
```

#### For Cloud Clusters (Helm)

```bash
# Add nginx ingress repository
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install nginx ingress controller
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer
```

#### Verify Installation

```bash
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

### Configure DNS

Once nginx Ingress is installed:

1. Get the Ingress external IP:

   ```bash
   kubectl get ingress -n shakwa shakwa-backend-ingress
   ```

2. Create a DNS A record pointing your domain to the Ingress IP:
   ```
   shakwa.yourdomain.com → <INGRESS-IP>
   ```

### Enable HTTPS/SSL (Optional)

#### Install cert-manager

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

#### Update Ingress for HTTPS

Edit `k8s/ingress.yaml` and uncomment the TLS section:

```yaml
spec:
  tls:
    - hosts:
        - shakwa.yourdomain.com
      secretName: shakwa-tls
  rules:
    - host: shakwa.yourdomain.com
```

Then uncomment the annotation:

```yaml
annotations:
  cert-manager.io/cluster-issuer: 'letsencrypt-prod'
```

Apply the changes:

```bash
kubectl apply -f k8s/ingress.yaml
```

---

## Auto-Scaling Configuration

The Horizontal Pod Autoscaler (HPA) automatically scales pods based on CPU and memory usage.

### Current Configuration

- **Min Replicas**: 3
- **Max Replicas**: 10
- **CPU Target**: 70% utilization
- **Memory Target**: 80% utilization

### Verify HPA

```bash
# Check HPA status
kubectl get hpa -n shakwa

# Detailed HPA information
kubectl describe hpa shakwa-backend-hpa -n shakwa
```

Expected output:

```
NAME                  REFERENCE                   TARGETS                        MINPODS   MAXPODS   REPLICAS   AGE
shakwa-backend-hpa   Deployment/shakwa-backend   45%/70%, 60%/80%              3         10        3          5m
```

### Monitor Auto-Scaling

Watch HPA in real-time:

```bash
kubectl get hpa -n shakwa -w
```

### Test Auto-Scaling

Generate load to trigger scaling:

```bash
# Install a load testing tool (e.g., Apache Bench)
# Then run:
ab -n 10000 -c 100 http://<EXTERNAL-IP>/api/health
```

Watch pods scale:

```bash
kubectl get pods -n shakwa -w
```

### Customize Scaling

Edit `k8s/hpa.yaml` to adjust:

- `minReplicas` / `maxReplicas`
- CPU/memory thresholds
- Scale-up/down behavior

Apply changes:

```bash
kubectl apply -f k8s/hpa.yaml
```

### Prerequisites for HPA

Ensure metrics-server is installed:

```bash
# Check if metrics-server is running
kubectl get deployment metrics-server -n kube-system

# For Minikube
minikube addons enable metrics-server

# For other clusters, install with:
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

---

## Monitoring and Management

### View Logs

```bash
# All pods
kubectl logs -n shakwa -l app=shakwa-backend -f

# Specific pod
kubectl logs -n shakwa <pod-name> -f

# Previous pod instance (if crashed)
kubectl logs -n shakwa <pod-name> --previous
```

### Execute Commands in Pod

```bash
# Get a shell
kubectl exec -it -n shakwa <pod-name> -- /bin/sh

# Run a command
kubectl exec -n shakwa <pod-name> -- npm --version
```

### Check Resource Usage

```bash
# Pod resource usage
kubectl top pods -n shakwa

# Node resource usage
kubectl top nodes
```

### Scale Manually (Override HPA temporarily)

```bash
# Scale to 5 replicas
kubectl scale deployment shakwa-backend -n shakwa --replicas=5
```

**Note**: HPA will override manual scaling based on metrics.

### Update Deployment (Rolling Update)

Update the image:

```bash
kubectl set image deployment/shakwa-backend \
  shakwa-backend=your-registry/shakwa-backend:v2 \
  -n shakwa
```

Or edit and apply:

```bash
# Edit deployment
kubectl edit deployment shakwa-backend -n shakwa

# Or update the file and apply
kubectl apply -f k8s/deployment.yaml
```

Watch rollout status:

```bash
kubectl rollout status deployment/shakwa-backend -n shakwa
```

### Rollback Deployment

```bash
# Rollback to previous version
kubectl rollout undo deployment/shakwa-backend -n shakwa

# Rollback to specific revision
kubectl rollout undo deployment/shakwa-backend -n shakwa --to-revision=2

# View rollout history
kubectl rollout history deployment/shakwa-backend -n shakwa
```

---

## Troubleshooting

### Pods Not Starting

**Check pod status:**

```bash
kubectl get pods -n shakwa
kubectl describe pod <pod-name> -n shakwa
```

**Common issues:**

- Image pull errors: Verify image registry and credentials
- Resource limits: Check if cluster has enough resources
- ConfigMap/Secret errors: Verify they exist and have correct values

### Application Not Accessible

**Check service:**

```bash
kubectl get svc -n shakwa
kubectl describe svc shakwa-backend-service -n shakwa
```

**Common issues:**

- LoadBalancer pending: Wait for cloud provider to provision (or use port-forward)
- Port mismatch: Verify service port (80) and container port (3000)
- Network policies: Check if cluster has network restrictions

### HPA Not Scaling

**Check HPA status:**

```bash
kubectl describe hpa shakwa-backend-hpa -n shakwa
```

**Common issues:**

- Metrics server not installed: Install metrics-server
- Resource requests not set: HPA requires resource requests in deployment
- Insufficient load: Generate more traffic to trigger scaling

### Database Connection Issues

**Check logs:**

```bash
kubectl logs -n shakwa <pod-name> | grep -i database
```

**Common issues:**

- Network connectivity: Verify external services are accessible from cluster
- Wrong credentials: Update secrets with correct values
- Firewall rules: Ensure cluster IP range is whitelisted in database

### High Memory Usage

**Check pod memory:**

```bash
kubectl top pods -n shakwa
```

**Solutions:**

- Increase memory limits in `deployment.yaml`
- Optimize application code
- Add more replicas to distribute load

### SSL/TLS Certificate Issues

**Check certificate:**

```bash
kubectl get certificate -n shakwa
kubectl describe certificate shakwa-tls -n shakwa
```

**Common issues:**

- DNS not propagated: Wait for DNS to propagate
- Wrong email in ClusterIssuer: Update with valid email
- Rate limits: Let's Encrypt has rate limits, wait or use staging

---

## Useful Commands

### Quick Reference

```bash
# View all resources
kubectl get all -n shakwa

# Delete all resources (careful!)
kubectl delete namespace shakwa

# View events
kubectl get events -n shakwa --sort-by='.lastTimestamp'

# Get pod names
kubectl get pods -n shakwa -o jsonpath='{.items[*].metadata.name}'

# Watch pod status
watch kubectl get pods -n shakwa

# Port forward to specific pod
kubectl port-forward -n shakwa <pod-name> 3000:3000

# Copy files from pod
kubectl cp -n shakwa <pod-name>:/app/uploads ./local-uploads

# Update secret
kubectl create secret generic shakwa-secrets \
  --from-file=.env=env/.env.production \
  --dry-run=client -o yaml | kubectl apply -n shakwa -f -

# Restart deployment (recreate pods)
kubectl rollout restart deployment/shakwa-backend -n shakwa

# Temporarily disable HPA
kubectl delete hpa shakwa-backend-hpa -n shakwa

# Re-enable HPA
kubectl apply -f k8s/hpa.yaml
```

### Debugging Tools

```bash
# Run a debug pod
kubectl run debug --image=busybox -it --rm --restart=Never -n shakwa -- sh

# Test DNS resolution
kubectl run dnsutils --image=tutum/dnsutils -it --rm --restart=Never -- nslookup shakwa-backend-service.shakwa.svc.cluster.local

# Network debugging
kubectl run netshoot --image=nicolaka/netshoot -it --rm --restart=Never -n shakwa -- bash
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  nginx Ingress        │
            │  Controller           │
            │  (SSL Termination)    │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  LoadBalancer         │
            │  Service              │
            │  (Session Affinity)   │
            └───────────┬───────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
    ┌─────┐         ┌─────┐         ┌─────┐
    │ Pod │         │ Pod │   ...   │ Pod │
    │  1  │         │  2  │         │ 3-10│
    └─────┘         └─────┘         └─────┘
        │               │               │
        └───────────────┴───────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │  PVC    │   │ External│   │ External│
    │Uploads  │   │Database │   │  Redis  │
    └─────────┘   └─────────┘   └─────────┘
```

**Auto-Scaling**: HPA monitors CPU/Memory and scales pods between 3-10 replicas  
**Load Balancing**: Service distributes traffic across all healthy pods  
**Zero Downtime**: Rolling updates with readiness probes ensure availability

---

## Production Checklist

Before deploying to production:

- [ ] Update all secrets in `k8s/secret.yaml`
- [ ] Configure proper image registry and update `deployment.yaml`
- [ ] Set up DNS for your domain
- [ ] Enable HTTPS/TLS with cert-manager
- [ ] Configure appropriate resource limits
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Configure backups for PersistentVolume
- [ ] Review and adjust HPA settings
- [ ] Test disaster recovery procedures
- [ ] Set up logging aggregation (ELK, Loki)
- [ ] Configure alerts for critical metrics
- [ ] Review security policies (NetworkPolicy, PodSecurityPolicy)

---

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [NestJS Documentation](https://docs.nestjs.com/)

---

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Kubernetes logs: `kubectl logs -n shakwa <pod-name>`
3. Check pod events: `kubectl describe pod -n shakwa <pod-name>`

---

**Happy Deploying! 🚀**
