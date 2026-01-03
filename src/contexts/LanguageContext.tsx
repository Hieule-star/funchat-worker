import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "vi" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Navbar
    "nav.chat": "Trò chuyện",
    "nav.contacts": "Danh bạ",
    "nav.profile": "Hồ sơ",
    "nav.logout": "Đăng xuất",
    "nav.login": "Đăng nhập",
    
    // Chat
    "chat.typeMessage": "Nhập tin nhắn...",
    "chat.online": "Đang hoạt động",
    "chat.offline": "Ngoại tuyến",
    "chat.typing": "đang nhập...",
    "chat.send": "Gửi",
    "chat.selectConversation": "Chọn cuộc trò chuyện để bắt đầu nhắn tin",
    "chat.noConversations": "Chưa có cuộc trò chuyện nào",
    "chat.startNew": "Bắt đầu cuộc trò chuyện mới",
    "chat.search": "Tìm kiếm...",
    "chat.newChat": "Cuộc trò chuyện mới",
    "chat.pinnedMessages": "Tin nhắn đã ghim",
    "chat.wallpaper": "Hình nền",
    "chat.viewProfile": "Xem hồ sơ",
    "chat.mute": "Tắt thông báo",
    "chat.deleteChat": "Xóa cuộc trò chuyện",
    
    // Auth
    "auth.signIn": "Đăng nhập",
    "auth.signUp": "Đăng ký",
    "auth.email": "Email",
    "auth.password": "Mật khẩu",
    "auth.username": "Tên người dùng",
    "auth.forgotPassword": "Quên mật khẩu?",
    
    // Friends
    "friends.search": "Tìm kiếm",
    "friends.requests": "Lời mời",
    "friends.list": "Bạn bè",
    "friends.add": "Kết bạn",
    "friends.accept": "Chấp nhận",
    "friends.reject": "Từ chối",
    "friends.pending": "Đang chờ",
    "friends.message": "Nhắn tin",
    
    // Profile
    "profile.edit": "Chỉnh sửa",
    "profile.friends": "Bạn bè",
    "profile.messages": "Tin nhắn",
    "profile.calls": "Cuộc gọi",
    "profile.overview": "Tổng quan",
    "profile.badges": "Huy hiệu",
    "profile.about": "Giới thiệu",
    
    // Common
    "common.save": "Lưu",
    "common.cancel": "Hủy",
    "common.delete": "Xóa",
    "common.confirm": "Xác nhận",
    "common.loading": "Đang tải...",
  },
  en: {
    // Navbar
    "nav.chat": "Chat",
    "nav.contacts": "Contacts",
    "nav.profile": "Profile",
    "nav.logout": "Logout",
    "nav.login": "Login",
    
    // Chat
    "chat.typeMessage": "Type a message...",
    "chat.online": "Online",
    "chat.offline": "Offline",
    "chat.typing": "typing...",
    "chat.send": "Send",
    "chat.selectConversation": "Select a conversation to start messaging",
    "chat.noConversations": "No conversations yet",
    "chat.startNew": "Start a new conversation",
    "chat.search": "Search...",
    "chat.newChat": "New conversation",
    "chat.pinnedMessages": "Pinned messages",
    "chat.wallpaper": "Wallpaper",
    "chat.viewProfile": "View profile",
    "chat.mute": "Mute notifications",
    "chat.deleteChat": "Delete chat",
    
    // Auth
    "auth.signIn": "Sign In",
    "auth.signUp": "Sign Up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.username": "Username",
    "auth.forgotPassword": "Forgot password?",
    
    // Friends
    "friends.search": "Search",
    "friends.requests": "Requests",
    "friends.list": "Friends",
    "friends.add": "Add Friend",
    "friends.accept": "Accept",
    "friends.reject": "Reject",
    "friends.pending": "Pending",
    "friends.message": "Message",
    
    // Profile
    "profile.edit": "Edit",
    "profile.friends": "Friends",
    "profile.messages": "Messages",
    "profile.calls": "Calls",
    "profile.overview": "Overview",
    "profile.badges": "Badges",
    "profile.about": "About",
    
    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.confirm": "Confirm",
    "common.loading": "Loading...",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved as Language) || "vi";
  });

  useEffect(() => {
    localStorage.setItem("app-language", language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "vi" ? "en" : "vi"));
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
