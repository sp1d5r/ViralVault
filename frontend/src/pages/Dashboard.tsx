import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../components/aceturnity/sidebar";
import {
  IconHome,
  IconUser,
  IconMessageCircle,
  IconLogout,
  IconFileText,
  IconSettings,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DashboardMain } from "../components/page-components/dashboard/DashboardMain";
import { AuthStatus, useAuth } from "../contexts/AuthenticationProvider";
import { ProfileStatus, useProfile } from "../contexts/ProfileProvider";
import DashboardProfile from "../components/page-components/dashboard/DashboardProfile";
import { useToast } from "../contexts/ToastProvider";
import DashboardChat from "../components/page-components/dashboard/DashboardChat";
import DashboardStories from "../components/page-components/dashboard/DashboardStories";
import { SystemPromptManager } from "../components/page-components/dashboard/SystemPromptManager";
import { Button } from "../components/shadcn/button";

const Dashboard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeContent, setActiveContent] = useState<string>("home");
  const { authState, logout } = useAuth();
  const { status: profileStatus, profile} = useProfile();
  const {toast} = useToast();

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    
    if (sessionId) {
      // Clear the URL parameter
      window.history.replaceState({}, '', '/dashboard');
      // Show success message
      toast({
        title: "Subscription Updated",
        description: "Your subscription has been updated successfully.",
      });
    }
  }, []);

  useEffect(() => {
    const content = searchParams.get("content");
    if (content && sidebarLinks.some(link => link.id === content)) {
      setActiveContent(content);
    } else {
      setActiveContent("home");
    }
  }, [searchParams]);

  useEffect(() => {
    if (authState) {
      switch (authState.status) {
        case AuthStatus.UNAUTHENTICATED:
          navigate("/authentication?mode=login");
          break;
        case AuthStatus.AUTHENTICATED:
          // Check profile status when authenticated
          console.log("Profile status:", authState.user);
          switch (profileStatus) {
            case ProfileStatus.NO_PROFILE:
            case ProfileStatus.NEEDS_ONBOARDING:
              // navigate("/onboarding");
              break;
            case ProfileStatus.COMPLETE:
            case ProfileStatus.LOADING:
              break;
          }
          break;
        case AuthStatus.LOADING:
          break;
      }
    }
  }, [authState, profileStatus, navigate]);

  const handleLinkClick = (id: string) => {
    navigate(`?content=${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="flex flex-col md:flex-row w-full h-screen">
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {open ? <Logo /> : <LogoIcon />}
              <div className="mt-8 flex flex-col gap-2">
                {sidebarLinks.map((link) => (
                  <SidebarLink 
                    key={link.id} 
                    link={link} 
                    onClick={() => handleLinkClick(link.id)}
                    active={activeContent === link.id}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <SidebarLink
                link={{
                  id: "profile",
                  label: (profile && profile.displayName) || '',
                  icon: <UserAvatar />
                }}
                onClick={() => handleLinkClick("profile")}
                active={activeContent === "profile"}
              />
              {open ? <Button variant="outline" size="sm" className="bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20" onClick={() => logout()}>Logout</Button> : <Button variant="outline" size="sm" className="bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20" onClick={() => logout()}>
                <IconLogout className="h-5 w-5 flex-shrink-0" />
              </Button>}
            </div>
          </SidebarBody>
        </Sidebar>
        <main className="flex-1 overflow-auto">
          {renderContent(activeContent)}
        </main>
      </div>
    </div>
  );
};

const Logo = () => (
  <div className="font-normal flex -space-x-[0.5rem] items-center text-sm text-white py-1 relative z-20">
    <p className="text-2xl font-bold text-indigo-400">V</p>
    <p className="text-2xl font-bold text-blue-400">V</p>
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-medium pl-2 whitespace-pre ml-3 bg-gradient-to-r from-indigo-400 via-blue-400 to-violet-400 bg-clip-text text-transparent"
    >
      ViralVault
    </motion.span>
  </div>
);

const LogoIcon = () => (
  <div className="font-normal flex -space-x-2 items-center text-sm text-white py-1 relative z-20 w-10">
    <p className="text-2xl font-bold text-indigo-400">V</p>
    <p className="text-2xl font-bold text-blue-400">V</p>
  </div>
);

const UserAvatar = () => (
<div className="h-7 w-7 flex-shrink-0 rounded-full bg-neutral-600" />
);

const sidebarLinks = [
{
    id: "home",
    label: "Dashboard",
    icon: <IconHome className="h-5 w-5 flex-shrink-0" />
},
{
    id: "stories",
    label: "Stories",
    icon: <IconFileText className="h-5 w-5 flex-shrink-0" />
},
{
    id: "system-prompts",
    label: "System Prompts",
    icon: <IconSettings className="h-5 w-5 flex-shrink-0" />
},
{
    id: "support-chat",
    label: "Chat History",
    icon: <IconMessageCircle className="h-5 w-5 flex-shrink-0" />
},
{
    id: "profile",
    label: "Profile",
    icon: <IconUser className="h-5 w-5 flex-shrink-0" />
}
];

const renderContent = (contentId: string) => {
  switch (contentId) {
    case "home":
      return <DashboardMain />;
    case "profile":
      return <DashboardProfile />;
    case "support-chat":
      return <DashboardChat />;
    case "stories":
      return <DashboardStories />;
    case "system-prompts":
      return <SystemPromptManager />;
    default:
      return <h1>404 Not Found</h1>;
  }
};

export default Dashboard;