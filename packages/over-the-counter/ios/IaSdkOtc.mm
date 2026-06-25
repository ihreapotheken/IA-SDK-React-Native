#import "IaSdkOtc.h"
#import "IaSdkOtc-Swift.h"

@implementation IaSdkOtc

- (void)registerModule {
  [[IaSdkOtcImpl shared] registerModule];
}

- (void)launchProductSearchRouteIOS {
  [[IaSdkOtcImpl shared] launchProductSearchRouteIOS];
}

// Run on the main thread: IACore (SDK 2.5.0+) asserts MainActor isolation.
- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeIaSdkOtcSpecJSI>(params);
}

+ (NSString *)moduleName {
  return @"IaSdkOtc";
}

@end
