interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Loading({ message = 'Chargement...', size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div
        className={`${sizeClasses[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`}
      />
      {message && (
        <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">
          {message}
        </p>
      )}
    </div>
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl">
        <Loading message={message} size="lg" />
      </div>
    </div>
  );
}

// Made with Bob