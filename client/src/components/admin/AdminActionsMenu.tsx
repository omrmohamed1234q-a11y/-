import { MoreVertical, Edit, Trash2, Eye, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface AdminActionsMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onDuplicate?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
  showView?: boolean;
  showDuplicate?: boolean;
  itemId?: string;
  itemType?: string;
}

export default function AdminActionsMenu({
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  showEdit = true,
  showDelete = true,
  showView = false,
  showDuplicate = false,
  itemId,
  itemType = 'item'
}: AdminActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-100 border border-gray-200"
          data-testid={`menu-actions-${itemId}`}
        >
          <MoreVertical className="h-4 w-4 text-gray-600" />
          <span className="sr-only">فتح القائمة</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {showView && onView && (
          <DropdownMenuItem onClick={onView} data-testid={`action-view-${itemId}`}>
            <Eye className="ml-2 h-4 w-4" />
            عرض التفاصيل
          </DropdownMenuItem>
        )}
        
        {showEdit && onEdit && (
          <DropdownMenuItem onClick={onEdit} data-testid={`action-edit-${itemId}`}>
            <Edit className="ml-2 h-4 w-4" />
            تعديل
          </DropdownMenuItem>
        )}
        
        {showDuplicate && onDuplicate && (
          <DropdownMenuItem onClick={onDuplicate} data-testid={`action-duplicate-${itemId}`}>
            <Copy className="ml-2 h-4 w-4" />
            نسخ
          </DropdownMenuItem>
        )}
        
        {(showEdit || showView || showDuplicate) && showDelete && (
          <DropdownMenuSeparator />
        )}
        
        {showDelete && onDelete && (
          <DropdownMenuItem 
            onClick={onDelete} 
            className="text-red-600 focus:text-red-600"
            data-testid={`action-delete-${itemId}`}
          >
            <Trash2 className="ml-2 h-4 w-4" />
            حذف
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}