import { useIsServiceRegistered } from "@/components/contexts/AssetsServiceContext";
import RegisterAudibleSource from "@/components/containers/RegisterAudibleSource";
import AudibleSource from "@/components/containers/AudibleSource";

export default function Audible() {
  const isServiceRegistered = useIsServiceRegistered("audible");

  if (isServiceRegistered) {
    return <AudibleSource />;
  } else {
    return <RegisterAudibleSource />;
  }
}
