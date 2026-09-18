import { initNetworkIntro } from '@/animations/network-intro';
import { initCapabilityNetworkEmphasis } from '@/network/init-capability-emphasis';

initNetworkIntro({
  rotation: {
    enabled: false,
  },
});

initCapabilityNetworkEmphasis();
