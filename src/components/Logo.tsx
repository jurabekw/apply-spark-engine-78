import logoImage from '@/assets/logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showText?: boolean;
}

const Logo = ({ size = 'md', variant = 'light', showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textColor = variant === 'light' 
    ? 'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'
    : 'text-white';

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <img 
          src={logoImage} 
          alt="TalentSpark Logo" 
          className={`${sizeClasses[size]} object-contain`}
        />
      </div>
      {showText && (
        <div>
          <h1 className={`${textSizeClasses[size]} font-heading font-bold ${textColor}`}>
            TalentSpark
          </h1>
          <p className={`text-xs ${variant === 'light' ? 'text-muted-foreground' : 'text-white/70'}`}>
            AI-Powered Recruitment
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;