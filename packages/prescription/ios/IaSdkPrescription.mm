#import "IaSdkPrescription.h"
#import "IaSdkPrescription-Swift.h"

@implementation IaSdkPrescription

- (void)registerModule {
  [[IaSdkPrescriptionImpl shared] registerModule];
}

- (void)launchRedeemPrescriptionScreenIOS {
  [[IaSdkPrescriptionImpl shared] launchRedeemPrescriptionScreenIOS];
}

// Run on the main thread: IACore (SDK 2.5.0+) asserts MainActor isolation.
- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeIaSdkPrescriptionSpecJSI>(params);
}

+ (NSString *)moduleName {
  return @"IaSdkPrescription";
}

@end
