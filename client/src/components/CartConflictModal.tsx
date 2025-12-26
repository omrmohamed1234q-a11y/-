import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info } from 'lucide-react';

interface CartConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
    conflictType: 'different_source' | 'different_partner';
    currentSource?: string;
    currentPartner?: { id: string; name: string };
    newItem: {
        source: string;
        partnerName?: string;
        productName: string;
    };
    onClearAndAdd: () => void;
    isLoading?: boolean;
}

export function CartConflictModal({
    isOpen,
    onClose,
    conflictType,
    currentSource,
    currentPartner,
    newItem,
    onClearAndAdd,
    isLoading = false
}: CartConflictModalProps) {
    const getSourceName = (source?: string) => {
        switch (source) {
            case 'partner':
                return 'شريك';
            case 'print_service':
                return 'خدمة الطباعة';
            case 'atbaali':
                return 'المتجر';
            default:
                return 'مصدر آخر';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="h-5 w-5" />
                        تعارض في السلة
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {conflictType === 'different_partner' ? (
                        <div className="text-sm text-gray-700">
                            <p className="mb-2">
                                لديك منتجات من <strong>{currentPartner?.name}</strong> في السلة.
                            </p>
                            <p>
                                لا يمكن الطلب من أكثر من شريك في نفس الوقت. هل تريد إفراغ السلة والطلب من <strong>{newItem.partnerName}</strong> بدلاً من ذلك؟
                            </p>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-700">
                            <p className="mb-2">
                                لديك {currentSource === 'print_service' ? 'طلبات طباعة' : currentSource === 'partner' ? `منتجات من ${currentPartner?.name}` : 'منتجات من المتجر'} في السلة.
                            </p>
                            <p>
                                لا يمكن خلط المنتجات من مصادر مختلفة. هل تريد إفراغ السلة وإضافة <strong>{newItem.productName}</strong>؟
                            </p>
                        </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-yellow-800">
                                سيتم حذف جميع المنتجات الحالية من السلة
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        إلغاء
                    </Button>
                    <Button
                        onClick={onClearAndAdd}
                        className="bg-orange-600 hover:bg-orange-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'جاري التحميل...' : 'إفراغ السلة والمتابعة'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
