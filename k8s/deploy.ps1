# ============================================
# Kubernetes Deployment Script for Shakwa (Windows/PowerShell)
# ============================================

Write-Host "🚀 Starting Shakwa Kubernetes Deployment..." -ForegroundColor Cyan
Write-Host ""

# Function to print colored output
function Print-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Warning {
    param($Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Print-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Check if kubectl is installed
try {
    kubectl version --client --short | Out-Null
    Print-Success "kubectl is installed"
} catch {
    Print-Error "kubectl is not installed. Please install it first."
    exit 1
}

# Check if cluster is accessible
try {
    kubectl cluster-info | Out-Null
    Print-Success "Connected to Kubernetes cluster"
} catch {
    Print-Error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
}

# Apply Kubernetes manifests
Write-Host ""
Write-Host "📦 Deploying resources to Kubernetes..." -ForegroundColor Cyan
Write-Host ""

Write-Host "1/8 Creating namespace..."
kubectl apply -f k8s/namespace.yaml
Print-Success "Namespace created"

Write-Host "2/8 Creating ConfigMap..."
kubectl apply -f k8s/configmap.yaml
Print-Success "ConfigMap created"

Write-Host "3/8 Creating Secrets..."
kubectl apply -f k8s/secret.yaml
Print-Success "Secrets created"

Write-Host "4/8 Creating PersistentVolumeClaim..."
kubectl apply -f k8s/pvc.yaml
Print-Success "PVC created"

Write-Host "5/8 Creating Deployment..."
kubectl apply -f k8s/deployment.yaml
Print-Success "Deployment created"

Write-Host "6/8 Creating Service..."
kubectl apply -f k8s/service.yaml
Print-Success "Service created"

Write-Host "7/8 Creating HorizontalPodAutoscaler..."
kubectl apply -f k8s/hpa.yaml
Print-Success "HPA created"

Write-Host "8/8 Creating Ingress..."
kubectl apply -f k8s/ingress.yaml
Print-Success "Ingress created"

Write-Host ""
Write-Host "⏳ Waiting for pods to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=shakwa-backend -n shakwa --timeout=300s

Write-Host ""
Print-Success "Deployment completed successfully!"

Write-Host ""
Write-Host "📊 Deployment Status:" -ForegroundColor Cyan
Write-Host "===================="
kubectl get all -n shakwa

Write-Host ""
Write-Host "🌐 Service Information:" -ForegroundColor Cyan
Write-Host "======================="
kubectl get svc shakwa-backend-service -n shakwa

Write-Host ""
Write-Host "📈 Auto-Scaling Status:" -ForegroundColor Cyan
Write-Host "======================="
kubectl get hpa -n shakwa

Write-Host ""
Write-Host "🔗 Access Information:" -ForegroundColor Cyan
Write-Host "====================="
$externalIP = kubectl get svc shakwa-backend-service -n shakwa -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null
if ($externalIP) {
    Write-Host "Application URL: http://$externalIP/api/health"
} else {
    Print-Warning "LoadBalancer IP is still pending. Run 'kubectl get svc -n shakwa' to check later."
    Write-Host "Or use port-forward: kubectl port-forward -n shakwa svc/shakwa-backend-service 3000:80"
}

Write-Host ""
Print-Success "All done! 🎉"
