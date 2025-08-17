import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Image, Video, Music, Archive,
  Download, Trash2, Eye, Search, Filter, Grid,
  List, Calendar, User, HardDrive, X
} from 'lucide-react';

interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  category: string;
  uploadedBy: string;
  metadata?: any;
  createdAt: string;
}

export function AdminFileManager() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch uploaded files
  const { data: files = [], isLoading } = useQuery<FileItem[]>({
    queryKey: ['/api/admin/files'],
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      return apiRequest('/api/admin/files/upload', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/files'] });
    },
  });

  // Delete files mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileIds: string[]) => {
      return apiRequest('/api/admin/files/delete', {
        method: 'DELETE',
        body: JSON.stringify({ fileIds }),
      });
    },
    onSuccess: () => {
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/files'] });
    },
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return Archive;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(files.map(f => f.category)))];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadMutation.mutate(files);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handlePreview = (file: FileItem) => {
    setPreviewFile(file);
  };

  const renderFilePreview = (file: FileItem) => {
    if (file.mimeType.startsWith('image/')) {
      return (
        <img
          src={`/api/admin/files/${file.id}/content`}
          alt={file.originalName}
          className="w-full h-64 object-cover rounded-lg"
        />
      );
    }
    
    if (file.mimeType === 'application/pdf') {
      return (
        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">PDF Document</p>
            <p className="text-sm text-gray-500">{file.originalName}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          {(() => {
            const IconComponent = getFileIcon(file.mimeType);
            return <IconComponent className="w-16 h-16 text-gray-400 mx-auto mb-2" />;
          })()}
          <p className="text-gray-600">{file.mimeType}</p>
          <p className="text-sm text-gray-500">{file.originalName}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">إدارة الملفات</h2>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              data-testid="button-view-grid"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              data-testid="button-view-list"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          <label htmlFor="file-upload">
            <Button asChild className="cursor-pointer" data-testid="button-upload-files">
              <span>
                <Upload className="w-4 h-4 mr-2" />
                رفع ملفات
              </span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            data-testid="input-file-upload"
          />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في الملفات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                  data-testid="input-search-files"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md"
                data-testid="select-category-filter"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'جميع الفئات' : category}
                  </option>
                ))}
              </select>
              
              {selectedFiles.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(selectedFiles)}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-selected"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  حذف المحدد ({selectedFiles.length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الملفات', value: files.length, icon: FileText },
          { label: 'الصور', value: files.filter(f => f.mimeType.startsWith('image/')).length, icon: Image },
          { label: 'المستندات', value: files.filter(f => f.mimeType.includes('pdf') || f.mimeType.includes('doc')).length, icon: FileText },
          { label: 'الحجم الإجمالي', value: formatFileSize(files.reduce((sum, f) => sum + f.fileSize, 0)), icon: HardDrive }
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <stat.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Files Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="bg-gray-200 h-32 rounded-lg mb-3"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-3 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <AnimatePresence>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map((file, index) => {
                const IconComponent = getFileIcon(file.mimeType);
                const isSelected = selectedFiles.includes(file.id);
                
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card 
                      className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => toggleFileSelection(file.id)}
                    >
                      <CardContent className="p-4">
                        <div className="relative">
                          {file.mimeType.startsWith('image/') ? (
                            <img
                              src={`/api/admin/files/${file.id}/content`}
                              alt={file.originalName}
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                              <IconComponent className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          
                          <div className="absolute top-2 right-2 flex space-x-1 space-x-reverse">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreview(file);
                              }}
                              data-testid={`button-preview-${file.id}`}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/api/admin/files/${file.id}/download`);
                              }}
                              data-testid={`button-download-${file.id}`}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="font-medium text-gray-900 text-sm truncate">
                            {file.originalName}
                          </h3>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatFileSize(file.fileSize)}</span>
                            <Badge variant="outline" className="text-xs">
                              {file.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400">
                            {new Date(file.createdAt).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredFiles.map((file, index) => {
                    const IconComponent = getFileIcon(file.mimeType);
                    const isSelected = selectedFiles.includes(file.id);
                    
                    return (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => toggleFileSelection(file.id)}
                      >
                        <div className="flex items-center flex-1 space-x-4 space-x-reverse">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <IconComponent className="w-5 h-5 text-gray-600" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {file.originalName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.fileSize)} • {file.category}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span className="text-sm text-gray-400">
                              {new Date(file.createdAt).toLocaleDateString('ar-SA')}
                            </span>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreview(file);
                              }}
                              data-testid={`button-preview-list-${file.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/api/admin/files/${file.id}/download`);
                              }}
                              data-testid={`button-download-list-${file.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </AnimatePresence>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{previewFile.originalName}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewFile(null)}
                  data-testid="button-close-preview"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="p-6">
                {renderFilePreview(previewFile)}
                
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p><strong>الحجم:</strong> {formatFileSize(previewFile.fileSize)}</p>
                  <p><strong>النوع:</strong> {previewFile.mimeType}</p>
                  <p><strong>الفئة:</strong> {previewFile.category}</p>
                  <p><strong>تاريخ الرفع:</strong> {new Date(previewFile.createdAt).toLocaleString('ar-SA')}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminFileManager;