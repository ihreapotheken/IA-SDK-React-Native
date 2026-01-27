#import "IaSdkCore.h"
#import "IaSdkCore-Swift.h"

@implementation IaSdkCore

- (void)initIaSdkIOS:(NSString *)accessKey
            clientId:(NSString *)clientId
 serverEnvironmentId:(NSString *)serverEnvironmentId
   completionHandler:(RCTResponseSenderBlock)completion {
  [[IaSdkCoreImpl shared] initIaSdkIOS:accessKey
                              clientId:clientId
                   serverEnvironmentId:serverEnvironmentId
                     completionHandler:^(NSString *err) {
                       completion(@[ err ?: [NSNull null] ]);
                     }];
}

- (void)setGuestUserDataIOS:(NSString *)salutation
                      firstName:(NSString *)firstName
                       lastName:(NSString *)lastName
                          email:(NSString *)email
         phoneNumberCountryCode:(NSNumber *)phoneNumberCountryCode
  phoneNumberWithoutCountryCode:(NSNumber *)phoneNumberWithoutCountryCode
              completionHandler:(RCTResponseSenderBlock)completion {
  NSInteger countryCode = [phoneNumberCountryCode integerValue];
  NSInteger number = [phoneNumberWithoutCountryCode integerValue];
  [[IaSdkCoreImpl shared] setGuestUserDataIOS:salutation
                                    firstName:firstName
                                     lastName:lastName
                                        email:email
                       phoneNumberCountryCode:countryCode
                phoneNumberWithoutCountryCode:number
                            completionHandler:^(NSString *err) {
                              completion(@[ err ?: [NSNull null] ]);
                            }];
}

- (void)startDashboardActivityIOS {
  [[IaSdkCoreImpl shared] startDashboardActivityIOS];
}

- (void)logoutIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkCoreImpl shared] logoutIOS:^(NSString *err) {
    completion(@[ err ?: [NSNull null] ]);
  }];
}

- (void)finishAllActivitiesIOS {
  [[IaSdkCoreImpl shared] finishAllActivitiesIOS];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeIaSdkCoreSpecJSI>(params);
}

+ (NSString *)moduleName {
  return @"IaSdkCore";
}

@end
