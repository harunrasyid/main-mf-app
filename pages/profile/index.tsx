import { ProfileItem } from "./components";
import { Footer, Navbar } from "@/components";
import { useRouter } from "next/router";

export default function Profile() {
  const router = useRouter();

  const onClickLocal = () => {
    router.push("/");
  };

  const onClickRemote = () => {
    router.push("/profile_app");
  };

  return (
    <main className="flex flex-col bg-white">
      <Navbar />
      <div className="h-[75vh] py-4">
        <ProfileItem />
        <ProfileItem />
        <button onClick={onClickLocal} className="text-black">
          LOCAL
        </button>
        <button onClick={onClickRemote} className="text-black">
          REMOTE
        </button>
      </div>
      <Footer />
    </main>
  );
}
