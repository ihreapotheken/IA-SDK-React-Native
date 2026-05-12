#import <React/RCTViewManager.h>

@interface IaSdkPlatformViewManager : RCTViewManager
@end

@implementation IaSdkPlatformViewManager

RCT_EXPORT_MODULE(IaSdkPlatformView)

- (UIView *)view
{
  return [NSClassFromString(@"IaSdkPlatformHostView") new];
}

RCT_EXPORT_VIEW_PROPERTY(viewId, NSString)
RCT_EXPORT_VIEW_PROPERTY(componentParams, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(onSizeChange, RCTDirectEventBlock)

@end
