import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface LoginCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  role: string;
  delay?: number;
  customPath?: string;
}

const LoginCard = ({ title, description, icon: Icon, role, delay = 0, customPath }: LoginCardProps) => {
  return (
    <Link
      to={customPath || `/login/${role}`}
      className="card-corporate p-6 group cursor-pointer animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors duration-300">
          <Icon className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
          <span>Login</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
    </Link>
  );
};

export default LoginCard;
