import { useState, useCallback } from 'react';
import { TCXParser } from '../../services/tcxParser';
import { ActivityService } from '../../services/database';
import type { Activity } from '../../types/activity';

interface FileUploadProps {
  onUploadSuccess?: (activity: Activity) => void;
  onUploadError?: (error: string) => void;
}

export function FileUpload({ onUploadSuccess, onUploadError }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress('Validation du fichier...');

    try {
      // Valider le fichier
      const isValid = await TCXParser.validateFile(file);
      if (!isValid) {
        throw new Error('Le fichier n\'est pas un fichier TCX valide');
      }

      setUploadProgress('Analyse du fichier TCX...');

      // Parser le fichier
      const activity = await TCXParser.parseFile(file);

      setUploadProgress('Vérification des doublons...');

      // Vérifier si l'activité existe déjà
      const exists = await ActivityService.activityExists(activity.id);
      if (exists) {
        throw new Error('Cette activité a déjà été importée');
      }

      setUploadProgress('Enregistrement dans la base de données...');

      // Sauvegarder dans la base de données
      await ActivityService.addActivity(activity);

      setUploadProgress('Import réussi !');
      
      if (onUploadSuccess) {
        onUploadSuccess(activity);
      }

      // Réinitialiser après un court délai
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress('');
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'import';
      console.error('Erreur d\'import:', error);
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }

      setUploadProgress('');
      setIsUploading(false);
    }
  }, [onUploadSuccess, onUploadError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const tcxFiles = files.filter(file => file.name.toLowerCase().endsWith('.tcx'));

    if (tcxFiles.length === 0) {
      if (onUploadError) {
        onUploadError('Aucun fichier TCX trouvé');
      }
      return;
    }

    // Pour l'instant, on ne traite qu'un seul fichier
    handleFile(tcxFiles[0]);
  }, [handleFile, onUploadError]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-200
          ${isDragging 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
          }
          ${isUploading ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".tcx"
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          {isUploading ? (
            <>
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {uploadProgress}
              </p>
            </>
          ) : (
            <>
              <svg
                className="w-16 h-16 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              
              <div className="text-center">
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Glissez-déposez votre fichier TCX ici
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  ou cliquez pour sélectionner un fichier
                </p>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById('file-input')?.click();
                }}
              >
                Sélectionner un fichier
              </button>

              <p className="text-xs text-gray-400 dark:text-gray-500">
                Formats acceptés : .tcx (Training Center XML)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Made with Bob
