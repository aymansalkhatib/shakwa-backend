#!/bin/bash

# ============================================
# Kubernetes Deployment Script for Shakwa
# ============================================

set -e  # Exit on error

echo "🚀 Starting Shakwa Kubernetes Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install it first."
    exit 1
fi

print_success "kubectl is installed"

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

print_success "Connected to Kubernetes cluster"

# Apply Kubernetes manifests
echo ""
echo "📦 Deploying resources to Kubernetes..."
echo ""

echo "1/8 Creating namespace..."
kubectl apply -f k8s/namespace.yaml
print_success "Namespace created"

echo "2/8 Creating ConfigMap..."
kubectl apply -f k8s/configmap.yaml
print_success "ConfigMap created"

echo "3/8 Creating Secrets..."
kubectl apply -f k8s/secret.yaml
print_success "Secrets created"

echo "4/8 Creating PersistentVolumeClaim..."
kubectl apply -f k8s/pvc.yaml
print_success "PVC created"

echo "5/8 Creating Deployment..."
kubectl apply -f k8s/deployment.yaml
print_success "Deployment created"

echo "6/8 Creating Service..."
kubectl apply -f k8s/service.yaml
print_success "Service created"

echo "7/8 Creating HorizontalPodAutoscaler..."
kubectl apply -f k8s/hpa.yaml
print_success "HPA created"

echo "8/8 Creating Ingress..."
kubectl apply -f k8s/ingress.yaml
print_success "Ingress created"

echo ""
echo "⏳ Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=shakwa-backend -n shakwa --timeout=300s

echo ""
print_success "Deployment completed successfully!"

echo ""
echo "📊 Deployment Status:"
echo "===================="
kubectl get all -n shakwa

echo ""
echo "🌐 Service Information:"
echo "======================="
kubectl get svc shakwa-backend-service -n shakwa

echo ""
echo "📈 Auto-Scaling Status:"
echo "======================="
kubectl get hpa -n shakwa

echo ""
echo "🔗 Access Information:"
echo "====================="
EXTERNAL_IP=$(kubectl get svc shakwa-backend-service -n shakwa -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
if [ "$EXTERNAL_IP" != "pending" ] && [ -n "$EXTERNAL_IP" ]; then
    echo "Application URL: http://$EXTERNAL_IP/api/health"
else
    print_warning "LoadBalancer IP is still pending. Run 'kubectl get svc -n shakwa' to check later."
    echo "Or use port-forward: kubectl port-forward -n shakwa svc/shakwa-backend-service 3000:80"
fi

echo ""
print_success "All done! 🎉"
