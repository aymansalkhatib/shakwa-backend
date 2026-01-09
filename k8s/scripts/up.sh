#!/bin/bash
# =============================================================================
# Shakwa Backend - Local Kubernetes Deployment Script
# =============================================================================
# This script deploys all Shakwa resources to a local Kubernetes cluster
# Usage: ./up.sh
# =============================================================================

set -e

echo "=========================================="
echo "Deploying Shakwa Backend to Kubernetes"
echo "=========================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "[1/7] Creating namespace..."
kubectl apply -f "$K8S_DIR/namespace.yaml"

echo ""
echo "[2/7] Waiting for namespace to be ready..."
kubectl wait --for=jsonpath='{.status.phase}'=Active namespace/shakwa --timeout=30s

echo ""
echo "[3/7] Applying secrets and configmaps..."
kubectl apply -f "$K8S_DIR/secrets/" 2>/dev/null || echo "No secrets found or already applied"
kubectl apply -f "$K8S_DIR/configmaps/" 2>/dev/null || echo "No configmaps found or already applied"

echo ""
echo "[4/7] Applying resource policies..."
kubectl apply -f "$K8S_DIR/limit-range.yaml"
kubectl apply -f "$K8S_DIR/resource-quota.yaml"
kubectl apply -f "$K8S_DIR/pdb.yaml"
kubectl apply -f "$K8S_DIR/pvc.yaml"

echo ""
echo "[5/7] Deploying application..."
kubectl apply -f "$K8S_DIR/deployment.yaml"
kubectl apply -f "$K8S_DIR/service.yaml"

echo ""
echo "[6/7] Applying autoscaling..."
kubectl apply -f "$K8S_DIR/hpa.yaml"

echo ""
echo "[7/7] Applying ingress..."
kubectl apply -f "$K8S_DIR/ingress.yaml"

echo ""
echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  kubectl get pods -n shakwa"
echo "  kubectl get svc -n shakwa"
echo "  kubectl logs -f deployment/shakwa-backend -n shakwa"
echo ""
