import { cn } from "../../lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";

interface Links {
    id: string;
    label: string;
    icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-full px-4 py-4 hidden md:flex md:flex-col",
          "bg-neutral-800/50 border-r border-neutral-700",
          "shadow-[1px_0_30px_-2px_rgba(99,102,241,0.3)]",
          "[box-shadow:1px_0_30px_-2px_rgba(99,102,241,0.3),inset_-1px_0_20px_-5px_rgba(99,102,241,0.2),0_0_20px_-3px_rgba(79,70,229,0.3)]",
          className
        )}
        animate={{
          width: animate ? (open ? "300px" : "70px") : "300px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between",
          "bg-neutral-800/50 border-b border-neutral-700",
          "shadow-[0_1px_15px_rgba(99,102,241,0.2)]"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-neutral-300 hover:text-white"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0",
                "bg-neutral-800/50 border-r border-neutral-700",
                "shadow-[1px_0_15px_rgba(99,102,241,0.2)]",
                "p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-neutral-300 hover:text-white"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  active,
  onClick,
  ...props
}: {
  link: Links;
  className?: string;
  active?: boolean;
  onClick?: () => void;
} & Omit<React.ComponentProps<"div">, "onClick">) => {
  const { open, animate } = useSidebar();
  return (
    <div
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-3 px-3 cursor-pointer rounded-lg transition-all",
        "text-neutral-300 hover:text-white",
        // Updated active state to match Story page styling
        active ? 
          "bg-indigo-500/20 border border-indigo-500/30 text-white" : 
          "hover:bg-neutral-700/50",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Update icon colors */}
      <div className={cn(
        "transition-colors duration-200",
        active ? "text-indigo-400" : "text-neutral-300 group-hover/sidebar:text-white"
      )}>
        {link.icon}
      </div>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "text-sm whitespace-pre inline-block !p-0 !m-0",
          "group-hover/sidebar:translate-x-1 transition duration-150",
          active ? 
            "text-white" : 
            "text-neutral-300 group-hover/sidebar:text-white"
        )}
      >
        {link.label}
      </motion.span>
    </div>
  );
};
