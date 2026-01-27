#import "IaSdkOtc.h"
#import "IaSdkOtc-Swift.h"

@implementation IaSdkOtc

- (void)registerModule {
  [[IaSdkOtcImpl shared] registerModule];
}

- (void)launchProductSearchRouteIOS {
  [[IaSdkOtcImpl shared] launchProductSearchRouteIOS];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeIaSdkOtcSpecJSI>(params);
}

+ (NSString *)moduleName {
  return @"IaSdkOtc";
}

@end
