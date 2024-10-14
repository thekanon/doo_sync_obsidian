import dynamic from "next/dynamic";

const LoginContainer = dynamic(() => import("./LoginContainer"), {
  ssr: false,
});

const Page = () => {
  return <LoginContainer />;
};

export default Page;
