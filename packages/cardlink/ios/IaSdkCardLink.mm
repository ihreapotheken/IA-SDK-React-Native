#import "IaSdkCardLink.h"
#import "IaSdkCardLink-Swift.h"

@interface IaSdkCardLink ()
@property (nonatomic, assign) BOOL hasListeners;
@end

@implementation IaSdkCardLink

RCT_EXPORT_MODULE()

- (instancetype)init {
  self = [super init];
  if (self) {
    __weak IaSdkCardLink *weakSelf = self;
    [[IaSdkCardLinkImpl shared] setEventEmitter:^(NSString *eventName, id body) {
      __strong IaSdkCardLink *strongSelf = weakSelf;
      if (strongSelf && strongSelf.hasListeners) {
        [strongSelf sendEventWithName:eventName body:body];
      }
    }];
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[
    @"CARDLINK_CONSENT_EVENT",
    @"CARDLINK_SESSION_CREATED",
    @"CARDLINK_PRESCRIPTIONS_REDEEMED",
    @"CARDLINK_EVENT",
    @"CARDLINK_ANALYTICS_EVENT"
  ];
}

- (void)startObserving {
  self.hasListeners = YES;
}

- (void)stopObserving {
  self.hasListeners = NO;
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

// MARK: - Registration

- (void)registerModule {
  [[IaSdkCardLinkImpl shared] registerModule];
}

// MARK: - Launch

- (void)launchIOS:(NSString *)sdkApiKey
         flowType:(NSString *)flowType
       pharmacyId:(NSString *)pharmacyId
    consentStatus:(NSString *)consentStatus
      phoneNumber:(NSString *)phoneNumber
           userId:(NSString *)userId
          canCode:(NSString *)canCode
         cardName:(NSString *)cardName
     primaryColor:(NSNumber *)primaryColor
     buttonsColor:(NSNumber *)buttonsColor
    textLinkColor:(NSNumber *)textLinkColor
bottomNavigationColor:(NSNumber *)bottomNavigationColor
      environment:(NSString *)environment
  saveCardEnabled:(NSNumber *)saveCardEnabled
completionHandler:(RCTResponseSenderBlock)completion {
  [[IaSdkCardLinkImpl shared] launchIOSWithSdkApiKey:sdkApiKey
                                            flowType:flowType
                                          pharmacyId:pharmacyId
                                       consentStatus:consentStatus
                                         phoneNumber:phoneNumber
                                              userId:userId
                                             canCode:canCode
                                            cardName:cardName
                                        primaryColor:primaryColor
                                        buttonsColor:buttonsColor
                                       textLinkColor:textLinkColor
                               bottomNavigationColor:bottomNavigationColor
                                         environment:environment
                                     saveCardEnabled:saveCardEnabled
                                   completionHandler:^(NSString *err) {
    completion(@[ err ?: [NSNull null] ]);
  }];
}

// MARK: - Getters

- (void)getVersionIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkCardLinkImpl shared] getVersionIOSWithCompletionHandler:^(NSString *result) {
    completion(@[ result ?: [NSNull null] ]);
  }];
}

- (void)getEnvironmentIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkCardLinkImpl shared] getEnvironmentIOSWithCompletionHandler:^(NSString *result) {
    completion(@[ result ?: [NSNull null] ]);
  }];
}

- (void)getLogFilePathIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkCardLinkImpl shared] getLogFilePathIOSWithCompletionHandler:^(NSString *result) {
    completion(@[ result ?: [NSNull null] ]);
  }];
}

// MARK: - Card Management

- (void)getSavedCardsIOS:(NSString *)userId completionHandler:(RCTResponseSenderBlock)completion {
  [[IaSdkCardLinkImpl shared] getSavedCardsIOSWithUserId:userId completionHandler:^(NSString *result) {
    completion(@[ result ?: [NSNull null] ]);
  }];
}

- (void)deleteCardIOS:(NSString *)userId
             cardName:(NSString *)cardName
    completionHandler:(RCTResponseSenderBlock)completion {
  [[IaSdkCardLinkImpl shared] deleteCardIOSWithUserId:userId
                                             cardName:cardName
                                    completionHandler:^(NSString *err) {
    completion(@[ err ?: [NSNull null] ]);
  }];
}

- (void)deleteAllCardsIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkCardLinkImpl shared] deleteAllCardsIOSWithCompletionHandler:^(NSString *result) {
    completion(@[ result ?: [NSNull null] ]);
  }];
}

- (void)deleteAllUserRelatedDataIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkCardLinkImpl shared] deleteAllUserRelatedDataIOSWithCompletionHandler:^(NSString *err) {
    completion(@[ err ?: [NSNull null] ]);
  }];
}

// MARK: - Event Listener Management

- (void)addListener:(NSString *)eventType {
  // Managed via startObserving/stopObserving
}

- (void)removeListeners:(double)count {
  // Managed via startObserving/stopObserving
}

// MARK: - TurboModule

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeIaSdkCardLinkSpecJSI>(params);
}

@end
