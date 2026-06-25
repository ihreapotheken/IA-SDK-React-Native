#import "IaSdkCore.h"
#import "IaSdkCore-Swift.h"

@implementation IaSdkCore

- (void)initIaSdkIOS:(NSString *)accessKey
            clientId:(NSString *)clientId
 serverEnvironmentId:(NSString *)serverEnvironmentId
           channelId:(NSNumber *)channelId
shouldFetchThemeFromRemote:(BOOL)shouldFetchThemeFromRemote
   completionHandler:(RCTResponseSenderBlock)completion {
  [[IaSdkCoreImpl shared] initIaSdkIOS:accessKey
                             clientId:clientId
                  serverEnvironmentId:serverEnvironmentId
                            channelId:channelId
           shouldFetchThemeFromRemote:shouldFetchThemeFromRemote
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

- (void)launchApofinderIOS {
  [[IaSdkCoreImpl shared] launchApofinderIOS];
}

- (void)logoutIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkCoreImpl shared] logoutIOS:^(NSString *err) {
    completion(@[ err ?: [NSNull null] ]);
  }];
}

- (void)finishAllActivitiesIOS {
  [[IaSdkCoreImpl shared] finishAllActivitiesIOS];
}

- (void)transferSDKv1UserDataIOS {
  [[IaSdkCoreImpl shared] transferSDKv1UserDataIOS];
}

- (void)isInitializedIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkCoreImpl shared] isInitializedIOS:^(BOOL result) {
    completion(@[ @(result) ]);
  }];
}

- (void)deleteUserIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkCoreImpl shared] deleteUserIOS:^(NSString *err) {
    completion(@[ err ?: [NSNull null] ]);
  }];
}

- (void)getEnvironmentIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkCoreImpl shared] getEnvironmentIOS:^(NSString *result) {
    completion(@[ result ?: [NSNull null] ]);
  }];
}

- (void)cleanCacheIOS:(BOOL)initialization
        prerequisites:(BOOL)prerequisites
    completionHandler:(RCTResponseSenderBlock)completion {
  [[IaSdkCoreImpl shared] cleanCacheIOS:initialization
                          prerequisites:prerequisites
                      completionHandler:^(NSString *err) {
    completion(@[ err ?: [NSNull null] ]);
  }];
}

- (void)setUserBillingAddressIOS:(NSString *)firstName
                        lastName:(NSString *)lastName
                  additionalInfo:(NSString *)additionalInfo
                          street:(NSString *)street
                     houseNumber:(NSString *)houseNumber
                         zipCode:(NSString *)zipCode
                            city:(NSString *)city
                      salutation:(NSString *)salutation
          phoneNumberCountryCode:(NSString *)phoneNumberCountryCode
   phoneNumberWithoutCountryCode:(NSString *)phoneNumberWithoutCountryCode
               completionHandler:(RCTResponseSenderBlock)completion {
  [[IaSdkCoreImpl shared] setUserBillingAddressIOS:firstName
                                          lastName:lastName
                                    additionalInfo:additionalInfo
                                            street:street
                                       houseNumber:houseNumber
                                           zipCode:zipCode
                                              city:city
                                        salutation:salutation
                            phoneNumberCountryCode:phoneNumberCountryCode
                     phoneNumberWithoutCountryCode:phoneNumberWithoutCountryCode
                                 completionHandler:^(NSString *err) {
                                   completion(@[ err ?: [NSNull null] ]);
                                 }];
}

- (void)setUserDeliveryAddressIOS:(NSString *)firstName
                         lastName:(NSString *)lastName
                   additionalInfo:(NSString *)additionalInfo
                           street:(NSString *)street
                      houseNumber:(NSString *)houseNumber
                          zipCode:(NSString *)zipCode
                             city:(NSString *)city
                       salutation:(NSString *)salutation
           phoneNumberCountryCode:(NSString *)phoneNumberCountryCode
    phoneNumberWithoutCountryCode:(NSString *)phoneNumberWithoutCountryCode
                completionHandler:(RCTResponseSenderBlock)completion {
  [[IaSdkCoreImpl shared] setUserDeliveryAddressIOS:firstName
                                           lastName:lastName
                                     additionalInfo:additionalInfo
                                             street:street
                                        houseNumber:houseNumber
                                            zipCode:zipCode
                                               city:city
                                         salutation:salutation
                             phoneNumberCountryCode:phoneNumberCountryCode
                      phoneNumberWithoutCountryCode:phoneNumberWithoutCountryCode
                                  completionHandler:^(NSString *err) {
                                    completion(@[ err ?: [NSNull null] ]);
                                  }];
}

// The ia.de SDK (IACore) APIs are @MainActor-isolated and assert main-thread
// execution at runtime (SDK 2.5.0+). React Native invokes TurboModule methods
// on a background queue by default, which trips that assertion and crashes
// (EXC_BREAKPOINT in _swift_task_checkIsolated). Pin this module's methods to
// the main queue so all IACore calls run on the main thread.
- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeIaSdkCoreSpecJSI>(params);
}

+ (NSString *)moduleName {
  return @"IaSdkCore";
}

@end
