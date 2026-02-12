'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { getUpgradeInfo } from '@/lib/api-organizations';
import type { UpgradeInfo } from '@/types/organization';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'credits' | 'rfx_limit' | 'users_limit';
  currentCredits?: number;
  requiredCredits?: number;
}

/**
 * Modal simple que muestra información de upgrade desde el backend
 * Principio KISS: Carga datos, muestra comparación, botón de upgrade
 */
export function UpgradeModal({ 
  isOpen, 
  onClose, 
  reason = 'credits',
  currentCredits,
  requiredCredits 
}: UpgradeModalProps) {
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      
      getUpgradeInfo()
        .then(setUpgradeInfo)
        .catch(err => {
          console.error('Error loading upgrade info:', err);
          setError('Error al cargar información de planes');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const getMessage = () => {
    switch (reason) {
      case 'credits':
        return `Necesitas ${requiredCredits} créditos pero solo tienes ${currentCredits} disponibles.`;
      case 'rfx_limit':
        return 'Has alcanzado el límite de RFX de tu plan este mes.';
      case 'users_limit':
        return 'Has alcanzado el límite de usuarios de tu plan.';
      default:
        return 'Actualiza tu plan para continuar.';
    }
  };

  const handleUpgrade = () => {
    if (upgradeInfo?.next_plan) {
      window.location.href = `/checkout?plan=${upgradeInfo.next_plan.tier}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Actualizar Plan</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && upgradeInfo && (
          <div className="space-y-6">
            {/* Mensaje del problema */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{getMessage()}</p>
            </div>

            {/* Comparación de planes */}
            <div className="grid grid-cols-2 gap-6">
              {/* Plan Actual */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Plan Actual</h3>
                <p className="text-2xl font-bold text-gray-900 mb-4">
                  {upgradeInfo.current_plan.name}
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>{upgradeInfo.current_plan.credits_per_month.toLocaleString()} créditos/mes</li>
                  <li>{upgradeInfo.current_plan.max_rfx_per_month} RFX/mes</li>
                  <li>{upgradeInfo.current_plan.max_users} usuarios</li>
                </ul>
              </div>

              {/* Siguiente Plan */}
              {upgradeInfo.next_plan ? (
                <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold text-green-900 mb-2">Plan Recomendado</h3>
                  <p className="text-2xl font-bold text-green-900 mb-4">
                    {upgradeInfo.next_plan.name}
                  </p>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li>{upgradeInfo.next_plan.credits_per_month.toLocaleString()} créditos/mes</li>
                    <li>{upgradeInfo.next_plan.max_rfx_per_month} RFX/mes</li>
                    <li>{upgradeInfo.next_plan.max_users} usuarios</li>
                  </ul>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    Ya tienes el plan más alto disponible.
                  </p>
                </div>
              )}
            </div>

            {/* Beneficios */}
            {upgradeInfo.benefits && upgradeInfo.benefits.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Qué obtendrás:</h3>
                <ul className="space-y-2">
                  {upgradeInfo.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Tal vez después
              </Button>
              {upgradeInfo.next_plan && (
                <Button
                  onClick={handleUpgrade}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Actualizar Ahora <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
