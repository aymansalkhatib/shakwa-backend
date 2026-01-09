#!/bin/bash
# =============================================================================
# Shakwa Backend - Local Kubernetes Cleanup Script
# =============================================================================
# This script removes all Shakwa resources from the Kubernetes cluster
# Usage: ./down.sh
# =============================================================================

set -e

echo "=========================================="
echo "Removing Shakwa Backend from Kubernetes"
echo "=========================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "[1/6] Removing ingress..."
kubectl delete -f "$K8S_DIR/ingress.yaml" --ignore-not-found=true

echo ""
echo "[2/6] Removing autoscaling..."
kubectl delete -f "$K8S_DIR/hpa.yaml" --ignore-not-found=true

echo ""
echo "[3/6] Removing application..."
kubectl delete -f "$K8S_DIR/service.yaml" --ignore-not-found=true
kubectl delete -f "$K8S_DIR/deployment.yaml" --ignore-not-found=true

echo ""
echo "[4/6] Removing resource policies..."
kubectl delete -f "$K8S_DIR/pvc.yaml" --ignore-not-found=true
kubectl delete -f "$K8S_DIR/pdb.yaml" --ignore-not-found=true
kubectl delete -f "$K8S_DIR/resource-quota.yaml" --ignore-not-found=true
kubectl delete -f "$K8S_DIR/limit-range.yaml" --ignore-not-found=true

echo ""
echo "[5/6] Removing secrets and configmaps..."
kubectl delete -f "$K8S_DIR/secrets/" --ignore-not-found=true 2>/dev/null || true
kubectl delete -f "$K8S_DIR/configmaps/" --ignore-not-found=true 2>/dev/null || true

echo ""
echo "[6/6] Removing namespace..."
kubectl delete -f "$K8S_DIR/namespace.yaml" --ignore-not-found=true

echo ""
echo "=========================================="
echo "Cleanup complete!"
echo "=========================================="
