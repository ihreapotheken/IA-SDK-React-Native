#import "IaSdkCardLink.h"
#import "IaSdkCardLink-Swift.h"

@implementation IaSdkCardLink

- (void)registerModule {
  [[IaSdkCardLinkImpl shared] registerModule];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeIaSdkCardLinkSpecJSI>(params);
}

+ (NSString *)moduleName {
  return @"IaSdkCardLink";
}

@end
