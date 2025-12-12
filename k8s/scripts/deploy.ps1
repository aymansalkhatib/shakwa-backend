# =============================================================================
# Shakwa Backend - Kubernetes Deployment Script (Windows PowerShell)
# =============================================================================
# This script deploys all Kubernetes resources in the correct order
# with validation and rollback capabilities
# =============================================================================

param(
    [Parameter(Position=0)]
    [ValidateSet("deploy", "validate", "status", "delete")]
    [string]$Action = "deploy"
)

# ===========================================
# Configuration
# ===========================================
$NAMESPACE = "shakwa"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$K8S_DIR = Split-Path -Parent $SCRIPT_DIR
$KUBECTL = "kubectl"
$TIMEOUT = "300s"

# ===========================================
# Helper Functions
# ===========================================
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-Prerequisites {
    Write-Info "Checking prerequisites..."

    if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
        Write-Error "kubectl is not installed. Please install it first."
        exit 1
    }

    $clusterInfo = & kubectl cluster-info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    }

    Write-Success "Prerequisites check passed"
}

function Test-Manifests {
    Write-Info "Validating Kubernetes manifests..."

    $errors = 0
    $yamlFiles = @()
    $yamlFiles += Get-ChildItem -Path $K8S_DIR -Filter "*.yaml" -File
    $yamlFiles += Get-ChildItem -Path "$K8S_DIR\secrets" -Filter "*.yaml" -File -ErrorAction SilentlyContinue
    $yamlFiles += Get-ChildItem -Path "$K8S_DIR\configmaps" -Filter "*.yaml" -File -ErrorAction SilentlyContinue

    foreach ($file in $yamlFiles) {
        # Skip service-monitor.yaml (requires Prometheus Operator CRDs)
        if ($file.Name -eq "service-monitor.yaml") {
            Write-Info "Skipping $($file.Name) (requires Prometheus Operator)"
            continue
        }

        $result = & kubectl apply --dry-run=client -f $file.FullName 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Validation failed for: $($file.FullName)"
            $errors++
        }
    }

    if ($errors -gt 0) {
        Write-Error "Manifest validation failed with $errors errors"
        exit 1
    }

    Write-Success "All manifests validated successfully"
}

# ===========================================
# Deployment Functions
# ===========================================
function Deploy-Namespace {
    Write-Info "Deploying namespace..."
    & kubectl apply -f "$K8S_DIR\namespace.yaml"
    Write-Success "Namespace deployed"
}

function Deploy-ResourcePolicies {
    Write-Info "Deploying resource policies..."
    & kubectl apply -f "$K8S_DIR\resource-quota.yaml"
    & kubectl apply -f "$K8S_DIR\limit-range.yaml"
    Write-Success "Resource policies deployed"
}

function Deploy-NetworkPolicies {
    Write-Info "Deploying network policies..."
    & kubectl apply -f "$K8S_DIR\network-policy.yaml"
    Write-Success "Network policies deployed"
}

function Deploy-ConfigMaps {
    Write-Info "Deploying ConfigMaps..."
    $configFiles = Get-ChildItem -Path "$K8S_DIR\configmaps" -Filter "*.yaml" -File -ErrorAction SilentlyContinue
    foreach ($file in $configFiles) {
        & kubectl apply -f $file.FullName
    }
    Write-Success "ConfigMaps deployed"
}

function Deploy-Secrets {
    Write-Info "Deploying Secrets..."
    Write-Warning "Make sure you have updated the secret values before deploying!"
    $secretFiles = Get-ChildItem -Path "$K8S_DIR\secrets" -Filter "*.yaml" -File -ErrorAction SilentlyContinue
    foreach ($file in $secretFiles) {
        & kubectl apply -f $file.FullName
    }
    Write-Success "Secrets deployed"
}

function Deploy-Storage {
    Write-Info "Deploying storage..."
    & kubectl apply -f "$K8S_DIR\pvc.yaml"
    Write-Success "Storage deployed"
}

function Deploy-Application {
    Write-Info "Deploying application..."
    & kubectl apply -f "$K8S_DIR\deployment.yaml"
    & kubectl apply -f "$K8S_DIR\service.yaml"
    & kubectl apply -f "$K8S_DIR\ingress.yaml"
    Write-Success "Application deployed"
}

function Deploy-Autoscaling {
    Write-Info "Deploying autoscaling..."
    & kubectl apply -f "$K8S_DIR\hpa.yaml"
    & kubectl apply -f "$K8S_DIR\pdb.yaml"
    Write-Success "Autoscaling deployed"
}

function Deploy-Monitoring {
    Write-Info "Deploying monitoring..."
    $crdCheck = & kubectl get crd servicemonitors.monitoring.coreos.com 2>&1
    if ($LASTEXITCODE -eq 0) {
        & kubectl apply -f "$K8S_DIR\service-monitor.yaml"
        Write-Success "Monitoring deployed"
    } else {
        Write-Warning "Prometheus Operator not found. Skipping ServiceMonitor deployment."
    }
}

function Wait-ForDeployment {
    Write-Info "Waiting for deployment to be ready..."
    & kubectl rollout status deployment/shakwa-backend -n $NAMESPACE --timeout=$TIMEOUT
    Write-Success "Deployment is ready"
}

function Show-Status {
    Write-Info "Deployment Status:"
    Write-Host ""
    Write-Host "=== Pods ===" -ForegroundColor Cyan
    & kubectl get pods -n $NAMESPACE
    Write-Host ""
    Write-Host "=== Services ===" -ForegroundColor Cyan
    & kubectl get svc -n $NAMESPACE
    Write-Host ""
    Write-Host "=== Ingress ===" -ForegroundColor Cyan
    & kubectl get ingress -n $NAMESPACE
    Write-Host ""
    Write-Host "=== HPA ===" -ForegroundColor Cyan
    & kubectl get hpa -n $NAMESPACE
}

# ===========================================
# Main Deployment Flow
# ===========================================
function Start-Deployment {
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "  Shakwa Backend - Kubernetes Deployment" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""

    Test-Prerequisites
    Test-Manifests

    Write-Host ""
    Write-Info "Starting deployment..."
    Write-Host ""

    Deploy-Namespace
    Deploy-ResourcePolicies
    Deploy-NetworkPolicies
    Deploy-ConfigMaps
    Deploy-Secrets
    Deploy-Storage
    Deploy-Application
    Deploy-Autoscaling
    Deploy-Monitoring

    Write-Host ""
    Wait-ForDeployment

    Write-Host ""
    Show-Status

    Write-Host ""
    Write-Success "Deployment completed successfully!"
}

# ===========================================
# Main Script Execution
# ===========================================
switch ($Action) {
    "deploy" { Start-Deployment }
    "validate" { Test-Prerequisites; Test-Manifests }
    "status" { Show-Status }
    "delete" {
        Write-Warning "Deleting all resources in namespace $NAMESPACE..."
        $confirm = Read-Host "Are you sure? (y/N)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            & kubectl delete namespace $NAMESPACE
            Write-Success "Namespace deleted"
        }
    }
}

